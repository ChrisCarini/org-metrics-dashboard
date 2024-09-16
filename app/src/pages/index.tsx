import { Layout } from '@/components/Layout';
import RepositoriesTable from '@/components/RepositoriesTable';

export default function HomePage() {
  return (
    <main className="p-4 md:p-10 mx-auto h-screen">
      <Layout>
        <RepositoriesTable />
      </Layout>
    </main>
  );
}
