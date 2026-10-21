# Review gates and release policy

## Decision flow

```text
Figma asset update
  -> Manual GitHub Action trigger
  -> Generate React component and story
  -> Lint + build + Storybook build
  -> Developer review and PR approval
  -> Merge to main
  -> Storybook publish
  -> UX/Product visual approval
  -> Release accepted
```

## Gate checklist

### Gate 1: Developer review
- code is generated according to design-system conventions
- naming is consistent
- exported API is stable
- build passes
- lint passes
- Storybook builds successfully

### Gate 2: UX/Product review
- icon matches the design direction from Figma
- spacing and sizing align with the system
- stroke and fill behavior match expectations
- accessibility is acceptable
- final sign-off is documented

## Branch protection recommendation

Use GitHub branch protection on the default branch to require:
- pull request review
- required status checks
- required code owner review
- no direct pushes to the main branch

This ensures the engineering gate cannot be bypassed.
