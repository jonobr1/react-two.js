import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { Ellipse } from './Ellipse';

const meta = {
  title: 'Primitives/Ellipse',
  component: Ellipse,
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
      control: { type: 'range', min: 20, max: 300, step: 10 },
      description: 'Width of the ellipse',
    },
    height: {
      control: { type: 'range', min: 20, max: 300, step: 10 },
      description: 'Height of the ellipse',
    },
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    x: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y: { control: { type: 'range', min: 0, max: 400, step: 10 } },
  },
} satisfies Meta<typeof Ellipse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    width: 120,
    height: 60,
    fill: '#00AEFF',
    x: 200,
    y: 200,
  },
};

export const Tall: Story = {
  args: {
    width: 60,
    height: 120,
    fill: '#FF6B6B',
    x: 200,
    y: 200,
  },
};

export const WithStroke: Story = {
  args: {
    width: 100,
    height: 70,
    fill: '#4ECDC4',
    stroke: '#000000',
    linewidth: 3,
    x: 200,
    y: 200,
  },
};
