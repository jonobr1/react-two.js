import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, RoundedRectangle } from './main';

const meta = {
  title: 'Primitives/RoundedRectangle',
  component: RoundedRectangle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    width: { control: { type: 'range', min: 20, max: 300, step: 10 } },
    height: { control: { type: 'range', min: 20, max: 300, step: 10 } },
    radius: {
      control: { type: 'range', min: 0, max: 50, step: 5 },
      description: 'Corner radius',
    },
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    x: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y: { control: { type: 'range', min: 0, max: 400, step: 10 } },
  },
} satisfies Meta<typeof RoundedRectangle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    width: 120,
    height: 80,
    radius: 10,
    fill: '#00AEFF',
    x: 200,
    y: 200,
  },
};

export const VeryRounded: Story = {
  args: {
    width: 120,
    height: 80,
    radius: 30,
    fill: '#FF6B6B',
    x: 200,
    y: 200,
  },
};

export const Square: Story = {
  args: {
    width: 100,
    height: 100,
    radius: 15,
    fill: '#4ECDC4',
    x: 200,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    width: 120,
    height: 80,
    radius: 10,
    fill: '#FFE66D',
    stroke: '#000000',
    linewidth: 3,
    x: 200,
    y: 200,
  },
};
