import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from './Provider';
import { Circle } from './Circle';
import { Rectangle } from './Rectangle';
import { Star } from './Star';

const meta = {
  title: 'Core/Canvas',
  component: Canvas,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'number', min: 200, max: 1200 },
      description: 'Canvas width',
    },
    height: {
      control: { type: 'number', min: 200, max: 800 },
      description: 'Canvas height',
    },
    type: {
      control: 'select',
      options: ['svg', 'canvas', 'webgl'],
      description: 'Renderer type',
    },
    autostart: {
      control: 'boolean',
      description: 'Automatically start animation loop',
    },
  },
} satisfies Meta<typeof Canvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SVGRenderer: Story = {
  args: {
    width: 600,
    height: 400,
    type: 'svg',
    children: (
      <>
        <Circle radius={50} fill="#00AEFF" x={150} y={200} />
        <Rectangle width={100} height={100} fill="#FF6B6B" x={300} y={200} />
        <Star innerRadius={20} outerRadius={40} sides={5} fill="#FFE66D" x={450} y={200} />
      </>
    ),
  },
};

export const CanvasRenderer: Story = {
  args: {
    width: 600,
    height: 400,
    type: 'canvas',
    children: (
      <>
        <Circle radius={50} fill="#4ECDC4" x={150} y={200} />
        <Rectangle width={100} height={100} fill="#95E1D3" x={300} y={200} />
        <Star innerRadius={20} outerRadius={40} sides={5} fill="#F38181" x={450} y={200} />
      </>
    ),
  },
};

export const WebGLRenderer: Story = {
  args: {
    width: 600,
    height: 400,
    type: 'webgl',
    children: (
      <>
        <Circle radius={50} fill="#AA96DA" x={150} y={200} />
        <Rectangle width={100} height={100} fill="#FCBAD3" x={300} y={200} />
        <Star innerRadius={20} outerRadius={40} sides={5} fill="#FFFFD2" x={450} y={200} />
      </>
    ),
  },
};

export const Small: Story = {
  args: {
    width: 300,
    height: 200,
    children: (
      <Circle radius={40} fill="#00AEFF" x={150} y={100} />
    ),
  },
};

export const Large: Story = {
  args: {
    width: 800,
    height: 600,
    children: (
      <>
        <Circle radius={80} fill="#FF6B6B" x={200} y={300} />
        <Rectangle width={150} height={150} fill="#4ECDC4" x={500} y={300} />
      </>
    ),
  },
};
