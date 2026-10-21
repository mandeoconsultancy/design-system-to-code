import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../frameworks/angular/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;
