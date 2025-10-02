import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { Canvas, Group, Circle, Rectangle, Star, useFrame } from './main';

const meta = {
  title: 'Core/Group',
  component: Group,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={600} height={400}>
        <Story />
      </Canvas>
    ),
  ],
  argTypes: {
    x: {
      control: { type: 'range', min: 0, max: 600, step: 10 },
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
  },
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    x: 300,
    y: 200,
    children: (
      <>
        <Rectangle width={100} height={100} fill="#FF6B6B" />
        <Circle radius={40} fill="#4ECDC4" x={120} />
      </>
    ),
  },
};

export const MultipleShapes: Story = {
  args: {
    x: 300,
    y: 200,
    children: (
      <>
        <Rectangle width={80} height={80} fill="#FF6B6B" />
        <Circle radius={35} fill="#4ECDC4" x={100} />
        <Star innerRadius={15} outerRadius={35} sides={5} fill="#FFE66D" x={-100} />
      </>
    ),
  },
};

export const Rotated: Story = {
  args: {
    x: 300,
    y: 200,
    rotation: Math.PI / 4,
    children: (
      <>
        <Rectangle width={100} height={100} fill="#95E1D3" />
        <Circle radius={40} fill="#F38181" x={120} />
      </>
    ),
  },
};

export const Scaled: Story = {
  args: {
    x: 300,
    y: 200,
    scale: 1.5,
    children: (
      <>
        <Rectangle width={60} height={60} fill="#AA96DA" />
        <Circle radius={25} fill="#FCBAD3" x={80} />
      </>
    ),
  },
};

function RotatingGroupComponent() {
  const ref = useRef<any>(null);

  useFrame((elapsed) => {
    if (ref.current) {
      ref.current.rotation = elapsed * 0.5;
    }
  });

  return (
    <Group ref={ref} x={300} y={200}>
      <Rectangle width={80} height={80} fill="#FF6B6B" />
      <Circle radius={35} fill="#4ECDC4" x={100} />
      <Star innerRadius={15} outerRadius={35} sides={5} fill="#FFE66D" x={-100} />
    </Group>
  );
}

export const Animated: Story = {
  render: () => <RotatingGroupComponent />,
};
