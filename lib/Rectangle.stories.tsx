import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { Rectangle } from './Rectangle';

const meta = {
  title: 'Primitives/Rectangle',
  component: Rectangle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    width: {
      control: { type: 'range', min: 10, max: 300, step: 10 },
      description: 'Width of the rectangle',
    },
    height: {
      control: { type: 'range', min: 10, max: 300, step: 10 },
      description: 'Height of the rectangle',
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
  },
} satisfies Meta<typeof Rectangle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    width: 100,
    height: 100,
    fill: '#00AEFF',
    x: 200,
    y: 200,
  },
};

export const Wide: Story = {
  args: {
    width: 200,
    height: 60,
    fill: '#FF6B6B',
    x: 200,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    width: 120,
    height: 80,
    fill: '#4ECDC4',
    stroke: '#000000',
    linewidth: 4,
    x: 200,
    y: 200,
  },
};

export const Rotated: Story = {
  args: {
    width: 100,
    height: 100,
    fill: '#FFE66D',
    rotation: Math.PI / 4,
    x: 200,
    y: 200,
  },
};
