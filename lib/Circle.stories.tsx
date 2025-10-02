import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, Circle } from './main';

const meta = {
  title: 'Primitives/Circle',
  component: Circle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    radius: {
      control: { type: 'range', min: 10, max: 150, step: 5 },
      description: 'The radius of the circle',
    },
    fill: {
      control: 'color',
      description: 'Fill color',
    },
    stroke: {
      control: 'color',
      description: 'Stroke color',
    },
    linewidth: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description: 'Stroke width',
    },
    x: {
      control: { type: 'range', min: 0, max: 400, step: 10 },
      description: 'X position',
    },
    y: {
      control: { type: 'range', min: 0, max: 400, step: 10 },
      description: 'Y position',
    },
    rotation: {
      control: { type: 'range', min: 0, max: Math.PI * 2, step: 0.1 },
      description: 'Rotation in radians',
    },
    scale: {
      control: { type: 'range', min: 0.1, max: 3, step: 0.1 },
      description: 'Scale factor',
    },
    opacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Opacity',
    },
  },
} satisfies Meta<typeof Circle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    radius: 50,
    fill: '#00AEFF',
    x: 200,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    radius: 60,
    fill: '#FF6B6B',
    stroke: '#000000',
    linewidth: 3,
    x: 200,
    y: 200,
  },
};

export const NoFill: Story = {
  args: {
    radius: 70,
    stroke: '#4ECDC4',
    linewidth: 5,
    x: 200,
    y: 200,
  },
};

export const Transparent: Story = {
  args: {
    radius: 80,
    fill: '#FFE66D',
    opacity: 0.5,
    x: 200,
    y: 200,
  },
};

export const Scaled: Story = {
  args: {
    radius: 40,
    fill: '#95E1D3',
    scale: 2,
    x: 200,
    y: 200,
  },
};
