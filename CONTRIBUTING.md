# Contributing

Thanks for helping improve Register Jolter Release Action.

## Development Setup

This action uses Bun for development, TypeScript for source, and `ncc` to bundle
the runtime files committed in `dist/`.

```bash
bun install
bun run typecheck
bun test
bun run build
bun run format:check
```

GitHub Actions executes `dist/index.js`, so rebuild and commit `dist/` whenever
source or dependency changes affect the bundle.

## Project Layout

- `action.yml`: public GitHub Action metadata.
- `src/index.ts`: action entrypoint.
- `src/lib.ts`: release resolution and registry request logic.
- `tests`: Bun tests for action behavior.
- `dist`: bundled action runtime.
- `examples`: example workflows for consumers.

## Pull Requests

Before opening a pull request:

1. Run `bun run typecheck`.
2. Run `bun test`.
3. Run `bun run build`.
4. Run `bun run format:check`.
5. Commit regenerated `dist/` output when it changes.

Keep pull requests focused and update documentation or examples for user-facing
changes.

## Security Issues

Do not open public issues for vulnerabilities. See `SECURITY.md`.
