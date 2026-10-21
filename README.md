# Design system to code pipeline

This project demonstrates a controlled design-to-code workflow. Figma is treated as the single source of truth, and the same design asset can be turned into framework-specific components and stories for React and Angular before being published to both Storybooks with explicit engineering and UX review gates.

## Included workflow pieces

- manual GitHub Action trigger for design sync
- framework-aware SVG-to-code generation for React and Angular
- Storybook visual validation for both React and Angular stories
- engineering validation and PR generation
- UX/Product review gate instructions

## Local steps

```bash
npm install
npm run design:sync
npm run storybook        # React Storybook
npm run storybook:angular   # Angular Storybook
```

The sync workflow compares the latest Figma export against a checksum manifest before generating new code, so only changed assets are refreshed and regenerated.

## Manual sync flow

1. Provide the Figma file key and node ID for the asset you want to import.
2. Set the GitHub secret `FIGMA_TOKEN`.
3. Trigger `Design System Sync` from the GitHub Actions tab.
4. The workflow fetches the SVG from Figma, stores it to the repo path, and generates the framework output (`react`, `angular`, or `all`).
5. Review the generated PR and component story set.
6. Merge after the engineering gate passes.
7. Open the relevant Storybook instance for UX/Product visual sign-off.

## Project structure

- `design-assets/` — design assets
- `scripts/` — design sync automation
- `.github/workflows/` — GitHub Actions pipelines
- `src/icons/` — generated React components and stories
- `frameworks/angular/` — generated Angular component templates and stories
- `docs/` — workflow and gate documentation

## Documentation

- [Design workflow](./docs/design-to-storybook-workflow.md)
- [Review gates](./docs/review-gates.md)
