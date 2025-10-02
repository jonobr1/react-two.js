import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { Path } from './Path';

const meta = {
  title: 'Advanced/Path',
  component: Path,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    closed: {
      control: 'boolean',
      description: 'Whether the path is closed',
    },
    curved: {
      control: 'boolean',
      description: 'Whether the path uses curves',
    },
  },
} satisfies Meta<typeof Path>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Triangle: Story = {
  args: {
    vertices: [
      { x: 200, y: 100 },
      { x: 280, y: 250 },
      { x: 120, y: 250 },
    ],
    closed: true,
    fill: '#00AEFF',
  },
};

export const OpenPath: Story = {
  args: {
    vertices: [
      { x: 100, y: 200 },
      { x: 200, y: 100 },
      { x: 300, y: 200 },
    ],
    closed: false,
    stroke: '#FF6B6B',
    linewidth: 3,
  },
};

export const CurvedPath: Story = {
  args: {
    vertices: [
      { x: 100, y: 200 },
      { x: 200, y: 100 },
      { x: 300, y: 200 },
    ],
    closed: false,
    curved: true,
    stroke: '#4ECDC4',
    linewidth: 3,
  },
};

export const CurvedShape: Story = {
  args: {
    vertices: [
      { x: 200, y: 100 },
      { x: 280, y: 180 },
      { x: 200, y: 260 },
      { x: 120, y: 180 },
    ],
    closed: true,
    curved: true,
    fill: '#FFE66D',
    stroke: '#000000',
    linewidth: 2,
  },
};

export const ComplexShape: Story = {
  args: {
    vertices: [
      { x: 200, y: 80 },
      { x: 260, y: 120 },
      { x: 280, y: 180 },
      { x: 240, y: 240 },
      { x: 200, y: 260 },
      { x: 160, y: 240 },
      { x: 120, y: 180 },
      { x: 140, y: 120 },
    ],
    closed: true,
    fill: '#95E1D3',
  },
};
