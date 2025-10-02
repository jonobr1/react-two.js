import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import { Canvas, LinearGradient, Rectangle, Circle } from './main';

const meta = {
  title: 'Advanced/LinearGradient',
  component: LinearGradient,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
} satisfies Meta<typeof LinearGradient>;

export default meta;
type Story = StoryObj<typeof meta>;

function HorizontalGradientExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <LinearGradient
        ref={updateRef}
        x1={100}
        y1={200}
        x2={300}
        y2={200}
        stops={[
          { offset: 0, color: '#FF6B6B' },
          { offset: 1, color: '#4ECDC4' }
        ]}
      />
      <Rectangle width={200} height={100} fill={gradient} x={200} y={200} />
    </>
  );
}

function VerticalGradientExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <LinearGradient
        ref={updateRef}
        x1={200}
        y1={100}
        x2={200}
        y2={300}
        stops={[
          { offset: 0, color: '#FFE66D' },
          { offset: 1, color: '#AA96DA' }
        ]}
      />
      <Rectangle width={200} height={200} fill={gradient} x={200} y={200} />
    </>
  );
}

function DiagonalGradientExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <LinearGradient
        ref={updateRef}
        x1={100}
        y1={100}
        x2={300}
        y2={300}
        stops={[
          { offset: 0, color: '#00AEFF' },
          { offset: 1, color: '#FF6B6B' }
        ]}
      />
      <Circle radius={80} fill={gradient} x={200} y={200} />
    </>
  );
}

function MultiStopGradientExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <LinearGradient
        ref={updateRef}
        x1={100}
        y1={200}
        x2={300}
        y2={200}
        stops={[
          { offset: 0, color: '#FF6B6B' },
          { offset: 0.5, color: '#FFE66D' },
          { offset: 1, color: '#4ECDC4' }
        ]}
      />
      <Rectangle width={200} height={150} fill={gradient} x={200} y={200} />
    </>
  );
}

export const Horizontal: Story = {
  render: () => <HorizontalGradientExample />,
};

export const Vertical: Story = {
  render: () => <VerticalGradientExample />,
};

export const Diagonal: Story = {
  render: () => <DiagonalGradientExample />,
};

export const MultipleStops: Story = {
  render: () => <MultiStopGradientExample />,
};
