# Register Jolter Release Action

GitHub Action that registers a published plugin release with the Jolter registry. It submits release metadata and the repository-scoped GitHub token; plugin artifacts remain hosted in the GitHub Release.

The release must contain:

- A WebAssembly asset
- plugin.json
- Optional checksums.txt

## Use

```yaml
name: Register Jolter release

on:
  release:
    types: [published]

permissions:
  contents: write

jobs:
  register:
    runs-on: ubuntu-latest
    steps:
      - uses: jolterjs/register-release-action@v1
        with:
          registry-url: https://registry.jolter.dev
          plugin-name: "@jolter/example"
          github-token: ${{ github.token }}
```

The action obtains the release tag from the release event and strips a leading v for the semantic version. version and release-tag inputs can override this behavior.

Rerunning the action is safe: an HTTP 409 response for an existing version is reported as registered=false rather than failing the workflow.

## Inputs

| Input        | Required | Description                                                   |
| ------------ | -------- | ------------------------------------------------------------- |
| registry-url | Yes      | Registry server origin                                        |
| plugin-name  | Yes      | Canonical plugin name or alias                                |
| github-token | Yes      | Repository-scoped GitHub token with contents write permission |
| version      | No       | Semantic version override                                     |
| release-tag  | No       | GitHub release tag override                                   |

## Outputs

- version
- release-tag
- registered

## Development

    bun install
    bun run typecheck
    bun test
    bun run build

GitHub executes dist/index.js, so rebuild and commit dist whenever source changes.
