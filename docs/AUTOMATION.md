# Automation & Docker Setup

This document outlines the automated workflows and containerization setup for the Slide project.

## CI/CD with GitHub Actions

The project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/ci.yml` and triggers on every push and pull request to the `main` branch.

It performs the following steps:
1.  **Linter**: Runs `pnpm lint` across the monorepo.
2.  **Type Check**: Runs `pnpm type-check` to ensure TypeScript safety.
3.  **Build**: Verifies that all applications and packages build correctly.

## Pre-commit Hooks

We use **Husky** and **lint-staged** to ensure code quality before commits are made.
-   When you run `git commit`, `lint-staged` will automatically run `eslint` and `prettier` on the staged files.
-   If any checks fail, the commit will be blocked until fixed.

## Docker Support

The project is containerized using Docker for consistent development and deployment environments.

### Services
-   **admin**: The Next.js admin dashboard.
-   **consumer-web**: The web version of the consumer mobile app.

### Commands
-   **Build containers**: `pnpm docker:build`
-   **Start services**: `pnpm docker:up`
-   **Stop services**: `pnpm docker:down`

### Dockerfiles
-   `apps/admin/Dockerfile`: Multi-stage build for the Next.js admin app.
-   `apps/consumer/Dockerfile`: Nginx-based build for the Expo web export.

## Local Development

To get started with the full stack locally:
1.  Install dependencies: `pnpm install`
2.  Start the development environment: `pnpm dev`
3.  (Optional) Run in Docker: `pnpm docker:up`
