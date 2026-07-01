# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use GitHub private vulnerability reporting if it is enabled for the repository.
If it is not enabled, contact the maintainers through the repository owner
profile or project website and include:

- A description of the vulnerability.
- Steps to reproduce or a proof of concept.
- The affected versions.
- Any known mitigations.

We will acknowledge valid reports as quickly as possible and coordinate a fix
before public disclosure.

## Scope

Security-sensitive areas include:

- Handling of `github-token`.
- Registry request construction.
- Release tag and version resolution.
- Behavior that could register the wrong plugin or release.
