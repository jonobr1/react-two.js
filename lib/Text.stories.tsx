import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, Text } from './main';

const meta = {
  title: 'Primitives/Text',
  component: Text,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={600} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    value: {
      control: 'text',
      description: 'Text content',
    },
    size: {
      control: { type: 'range', min: 10, max: 100, step: 2 },
      description: 'Font size',
    },
    family: {
      control: 'text',
      description: 'Font family',
    },
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 10, step: 0.5 } },
    x: { control: { type: 'range', min: 0, max: 600, step: 10 } },
    y: { control: { type: 'range', min: 0, max: 400, step: 10 } },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    value: 'Hello Two.js',
    size: 32,
    fill: '#00AEFF',
    x: 300,
    y: 200,
  },
};

export const Large: Story = {
  args: {
    value: 'Big Text',
    size: 60,
    fill: '#FF6B6B',
    x: 300,
    y: 200,
  },
};

export const Small: Story = {
  args: {
    value: 'Small Text',
    size: 16,
    fill: '#4ECDC4',
    x: 300,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    value: 'Outlined',
    size: 48,
    fill: '#FFE66D',
    stroke: '#000000',
    linewidth: 2,
    x: 300,
    y: 200,
  },
};

export const CustomFont: Story = {
  args: {
    value: 'Monospace Text',
    size: 32,
    family: 'monospace',
    fill: '#95E1D3',
    x: 300,
    y: 200,
  },
};
