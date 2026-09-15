# Contributing to Tenali

Welcome, and thank you for your interest in contributing to Tenali! 

We welcome contributions from everyone, whether it's fixing a bug, adding a new feature, improving documentation, or suggesting an idea.

## How to Contribute

### 1. Reporting Bugs & Suggesting Features
- Please check the existing issues to ensure someone hasn't already reported the same issue or suggested the same feature.
- Open a new issue outlining the problem or feature, including as much detail as possible.

### 2. Making Changes
- **Fork the repository** and clone it locally.
- **Create a branch** for your changes, named `<type>/<short-description>` — `feat/add-new-quiz-mode` or `fix/login-bug`, not `feature/...` (see the [README's branch table](README.md#-quick-start) for the full list of prefixes actually in use: `feat`, `fix`, `chore`, `docs`, `refactor`).
- **Make your changes**. Ensure your code is clean and readable.

### 3. Quality Checks
These are what CI actually runs on every PR (see `.github/workflows/test.yml`) — matching them locally means you're not surprised by a red check:
- **Client lint:** `cd client && npm run lint` (currently non-blocking in CI until `App.jsx` is split up — but please still run it and fix what you introduce).
- **Server tests:** `cd server && npm test`.
- **BKT unit check:** `node server/lib/bkt.test.js`.

There is no `npm run format` or root-level `npm run build`/`npm run test` in this repo — don't rely on tooling docs that assume a single unified script at the root; `client/` and `server/` are separate npm packages with their own scripts.

### 4. Submitting a Pull Request
- Push your branch to your fork.
- Open a Pull Request against the `main` branch.
- Describe what changed and why; add screenshots if your changes affect the UI. (There is currently no `.github/PULL_REQUEST_TEMPLATE.md` in this repo, so there's no checklist to fill out — just a clear description.)
- Wait for a maintainer to review your code. We may request some changes before merging!
- **New contributors:** submit the [Onboarding Document](README.md#-contributor-onboarding-mandatory) to `Ideas/` before your first PR — see the README for the required sections.

## Core Maintainers & Interns
If you are joining as a dedicated intern or a core maintainer, please refer to the `docs/` directory in this repository for more in-depth guidelines, RFC templates, and project standards.

Thank you for helping make Tenali better!
