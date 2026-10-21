# Design-to-Storybook workflow

This repository demonstrates a controlled workflow for design assets that are updated in Figma and then synced into the codebase and Storybook for multiple frontend stacks. Figma remains the single source of truth, while the automation creates framework-specific outputs for React and Angular and publishes the relevant stories to both Storybooks.

## Workflow overview

1. A UI/UX designer updates or adds an SVG asset in the design source (Figma).
2. A workflow is triggered manually in GitHub Actions for the target Figma page or asset node.
3. The workflow polls the Figma file metadata, compares the latest export checksum with the saved manifest, and only fetches the changed assets.
4. The changed asset is converted into framework-specific output for React and Angular, including Storybook stories.
5. Automated validation runs: lint, build, and Storybook build.
6. A pull request is created for engineering review.
7. A developer approves the generated code before merge.
8. The appropriate Storybook preview is reviewed by UX/Product.
9. Final sign-off approves release for both frameworks.

## Gatekeeping model

### Gate 1: Engineer review before merge

This gate protects the codebase and ensures that generated code matches engineering standards.

Required actions:
- review generated component naming
- verify compatibility with the design system conventions
- confirm Storybook story quality
- validate lint/build/test results

### Gate 2: UX/Product review in Storybook

This gate protects visual fidelity and design intent.

Required actions:
- open the Storybook preview in a browser
- compare the rendered asset with the source design in Figma
- confirm size, stroke, spacing, and color fidelity
- approve or request changes

## GitHub automation implementation

The repository includes:
- a manual GitHub Action for design sync (`.github/workflows/design-sync.yml`)
- a PR Storybook preview workflow (`.github/workflows/storybook-preview.yml`)
- a script that converts design SVG assets into framework-specific outputs for React and Angular (`scripts/generate-icon.mjs`)

## How to trigger the design sync

1. Provide the Figma file key and node ID for the asset you want to pull.
2. Store a GitHub secret named `FIGMA_TOKEN` with the Figma personal access token.
3. Run the GitHub Action manually from the Actions tab.
4. The workflow calls the Figma API, downloads the SVG, saves it to the target repo path, and then generates framework outputs.
5. If you are not pulling from Figma directly, you can also pass a repo asset path such as `design-assets/icons/upload-cloud.svg`.
6. Review the generated PR and all generated story outputs.
7. Merge once the engineering gate is satisfied.
8. Open the relevant Storybook preview for UX/Product review.

## Future migration path

This workflow is intentionally isolated from platform-specific deployment logic. A future Azure DevOps migration can reuse the same generator scripts, the same Figma single-source-of-truth model, and the same review gates by replacing only the orchestration layer and the publishing target for each Storybook environment.
