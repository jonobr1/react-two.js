import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { Line } from './Line';

const meta = {
  title: 'Primitives/Line',
  component: Line,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    x1: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y1: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    x2: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y2: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  },
} satisfies Meta<typeof Line>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    x1: 100,
    y1: 100,
    x2: 300,
    y2: 300,
    stroke: '#00AEFF',
    linewidth: 2,
  },
};

export const Horizontal: Story = {
  args: {
    x1: 50,
    y1: 200,
    x2: 350,
    y2: 200,
    stroke: '#FF6B6B',
    linewidth: 3,
  },
};

export const Vertical: Story = {
  args: {
    x1: 200,
    y1: 50,
    x2: 200,
    y2: 350,
    stroke: '#4ECDC4',
    linewidth: 3,
  },
};

export const Thick: Story = {
  args: {
    x1: 100,
    y1: 150,
    x2: 300,
    y2: 250,
    stroke: '#FFE66D',
    linewidth: 10,
  },
};
