import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, Polygon } from './main';

const meta = {
  title: 'Primitives/Polygon',
  component: Polygon,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    sides: {
      control: { type: 'range', min: 3, max: 12, step: 1 },
      description: 'Number of sides',
    },
    radius: {
      control: { type: 'range', min: 20, max: 150, step: 10 },
      description: 'Radius from center to vertices',
    },
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    x: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y: { control: { type: 'range', min: 0, max: 400, step: 10 } },
  },
} satisfies Meta<typeof Polygon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Triangle: Story = {
  args: {
    sides: 3,
    radius: 60,
    fill: '#00AEFF',
    x: 200,
    y: 200,
  },
};

export const Pentagon: Story = {
  args: {
    sides: 5,
    radius: 70,
    fill: '#FF6B6B',
    x: 200,
    y: 200,
  },
};

export const Hexagon: Story = {
  args: {
    sides: 6,
    radius: 70,
    fill: '#4ECDC4',
    x: 200,
    y: 200,
  },
};

export const Octagon: Story = {
  args: {
    sides: 8,
    radius: 70,
    fill: '#FFE66D',
    x: 200,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    sides: 6,
    radius: 70,
    fill: '#95E1D3',
    stroke: '#000000',
    linewidth: 4,
    x: 200,
    y: 200,
  },
};
