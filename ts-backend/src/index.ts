import "dotenv/config";
import fs from "fs-extra";
import {
  addDiscussionData,
  addIssueAndPrData,
  addIssueMetricsData,
  addMetaToResult,
  addOrganizationInfoToResult,
  addRepositoriesToResult,
} from "./fetchers";
import { checkRateLimit, CustomOctokit, personalOctokit } from "./lib/octokit";

export interface Result {
  meta: {
    createdAt: string;
  };
  orgInfo: {
    login: string;
    name?: string;
    description: string | null;
    createdAt: string;
    repositoriesCount: number;
    // "membersWithRoleCount": number;
    // "projectsCount": number;
    // "projectsV2Count": number;
    // "teamsCount": number;
  };
  repositories: Record<string, RepositoryResult>;
}

export interface RepositoryResult {
  // Repo metadata
  repositoryName: string;
  repoNameWithOwner: string;
  licenseName: string;

  // Counts of various things
  projectsCount: number;
  projectsV2Count: number;
  discussionsCount: number;
  forksCount: number;
  totalIssuesCount: number;
  openIssuesCount: number;
  closedIssuesCount: number;
  totalPullRequestsCount: number;
  openPullRequestsCount: number;
  closedPullRequestsCount: number;
  mergedPullRequestsCount: number;
  watchersCount: number;
  starsCount: number;
  collaboratorsCount: number;

  // Flags
  discussionsEnabled: boolean;
  projectsEnabled: boolean;
  issuesEnabled: boolean;

  // Calculated metrics
  openIssuesAverageAge: number;
  openIssuesMedianAge: number;
  closedIssuesAverageAge: number;
  closedIssuesMedianAge: number;
  issuesResponseAverageAge: number;
  issuesResponseMedianAge: number;
}

export type Fetcher = (
  result: Result,
  octokit: CustomOctokit,
  config: Config
) => Promise<Result> | Result;

export interface Config {
  organization: string;
  includeForks?: boolean;
  includeArchived?: boolean;
  since?: string; // Used for limiting the date range of items to fetch
}

// Check for the GRAPHQL_TOKEN environment variable
if (!process.env.GRAPHQL_TOKEN) {
  console.log("GRAPHQL_TOKEN environment variable is required, exiting...");
  throw new Error("GRAPHQL_TOKEN environment variable is required!");
}

console.log("Starting GitHub organization metrics fetcher");
console.log("🔑  Authenticating with GitHub");

const octokit = personalOctokit(process.env.GRAPHQL_TOKEN!);

// Read in configuration for the fetchers
// TODO: Figure this out
const config: Config = {
  organization: "sbv-world-health-org-metrics",
  includeForks: false,
  includeArchived: false,
  // Default since date is 180 days ago
  since: new Date(Date.now() - 180 * (24 * 60 * 60 * 1000)).toISOString(),
};

const pipeline =
  (octokit: CustomOctokit, config: Config) =>
  async (...fetchers: Fetcher[]) => {
    let result = {} as Result;

    for (const fetcher of fetchers) {
      console.log(`🔧  Running fetcher ${fetcher.name}`);
      result = await fetcher(result, octokit, config);
      console.log(`✨  Finished ${fetcher.name}`);
      const res = await checkRateLimit(octokit);
      console.log(
        `⚙️  Rate limit: ${res.remaining}/${
          res.limit
        } remaining until ${res.resetDate.toLocaleString()}`
      );
    }

    return result;
  };

const outputResult = async (result: Result) => {
  const destination = "./data.json";
  fs.outputJSONSync(destination, result, { spaces: 2 });
  console.log(`📦  Wrote result to ${destination}`);
};

const result = await pipeline(octokit, config)(
  addMetaToResult,
  addOrganizationInfoToResult,
  addRepositoriesToResult,
  addIssueAndPrData,
  addDiscussionData,
  addIssueMetricsData
);

outputResult(result);
