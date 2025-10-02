import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { Star } from './Star';

const meta = {
  title: 'Primitives/Star',
  component: Star,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    innerRadius: {
      control: { type: 'range', min: 10, max: 100, step: 5 },
      description: 'Inner radius of the star',
    },
    outerRadius: {
      control: { type: 'range', min: 20, max: 150, step: 5 },
      description: 'Outer radius of the star',
    },
    sides: {
      control: { type: 'range', min: 3, max: 12, step: 1 },
      description: 'Number of points',
    },
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    x: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y: { control: { type: 'range', min: 0, max: 400, step: 10 } },
  },
} satisfies Meta<typeof Star>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    innerRadius: 30,
    outerRadius: 70,
    sides: 5,
    fill: '#FFE66D',
    x: 200,
    y: 200,
  },
};

export const Sharp: Story = {
  args: {
    innerRadius: 20,
    outerRadius: 80,
    sides: 5,
    fill: '#FF6B6B',
    x: 200,
    y: 200,
  },
};

export const Rounded: Story = {
  args: {
    innerRadius: 50,
    outerRadius: 70,
    sides: 5,
    fill: '#4ECDC4',
    x: 200,
    y: 200,
  },
};

export const SixPointed: Story = {
  args: {
    innerRadius: 35,
    outerRadius: 70,
    sides: 6,
    fill: '#95E1D3',
    x: 200,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    innerRadius: 30,
    outerRadius: 70,
    sides: 5,
    fill: '#AA96DA',
    stroke: '#000000',
    linewidth: 3,
    x: 200,
    y: 200,
  },
};
