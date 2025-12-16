import { defineConfig } from '@storybook/react'

export default defineConfig({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-onboarding', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
})
