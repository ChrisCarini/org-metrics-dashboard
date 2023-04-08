# Before using, configure goproxy; see https://goproxy.githubapp.com/setup.
.PHONY: all
all: build

.PHONY: build
build: metrics

tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.51.2
	.devcontainer/scripts/install-tools.sh

.PHONY: test
test:  test-go

.PHONY: lint
lint: tools vet
	@echo "==> linting Go code <=="
	cd backend && golangci-lint run ./...

.PHONY: vet
vet:
	@echo "==> vetting Go code <=="
	cd backend && go vet ./...

.PHONY: clean
clean:
	@echo "==> cleaning <=="
	rm -rf backend/bin
	cd backend && go clean -cache -testcache -modcache

.PHONY: metrics
metrics:
	@echo "==> building metrics <=="
	cd backend && go build -o ./bin/metircs ./cmd/metrics

test-go:
	@echo "==> running Go tests <=="
	CGO_ENABLED=1 go test -p 64 -race ./backend/...
