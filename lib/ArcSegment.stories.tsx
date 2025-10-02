import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { ArcSegment } from './ArcSegment';

const meta = {
  title: 'Primitives/ArcSegment',
  component: ArcSegment,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    innerRadius: { control: { type: 'range', min: 0, max: 100, step: 5 } },
    outerRadius: { control: { type: 'range', min: 20, max: 150, step: 5 } },
    startAngle: {
      control: { type: 'range', min: 0, max: Math.PI * 2, step: 0.1 },
      description: 'Start angle in radians',
    },
    endAngle: {
      control: { type: 'range', min: 0, max: Math.PI * 2, step: 0.1 },
      description: 'End angle in radians',
    },
    fill: { control: 'color' },
    stroke: { control: 'color' },
    linewidth: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    x: { control: { type: 'range', min: 0, max: 400, step: 10 } },
    y: { control: { type: 'range', min: 0, max: 400, step: 10 } },
  },
} satisfies Meta<typeof ArcSegment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Quarter: Story = {
  args: {
    innerRadius: 40,
    outerRadius: 80,
    startAngle: 0,
    endAngle: Math.PI / 2,
    fill: '#00AEFF',
    x: 200,
    y: 200,
  },
};

export const Half: Story = {
  args: {
    innerRadius: 40,
    outerRadius: 80,
    startAngle: 0,
    endAngle: Math.PI,
    fill: '#FF6B6B',
    x: 200,
    y: 200,
  },
};

export const ThreeQuarters: Story = {
  args: {
    innerRadius: 40,
    outerRadius: 80,
    startAngle: 0,
    endAngle: (Math.PI * 3) / 2,
    fill: '#4ECDC4',
    x: 200,
    y: 200,
  },
};

export const Thin: Story = {
  args: {
    innerRadius: 60,
    outerRadius: 70,
    startAngle: 0,
    endAngle: Math.PI,
    fill: '#FFE66D',
    x: 200,
    y: 200,
  },
};

export const NoInnerRadius: Story = {
  args: {
    innerRadius: 0,
    outerRadius: 80,
    startAngle: 0,
    endAngle: Math.PI / 2,
    fill: '#95E1D3',
    x: 200,
    y: 200,
  },
};
