import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../lib/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../lib/**/*.mdx"
  ],
  "addons": [
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "docs": {
    "autodocs": "tag"
  },
  "typescript": {
    "reactDocgen": "react-docgen-typescript"
  }
};
export default config;