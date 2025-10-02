import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import { Canvas } from './Provider';
import { RadialGradient } from './RadialGradient';
import { Circle } from './Circle';
import { Rectangle } from './Rectangle';

const meta = {
  title: 'Advanced/RadialGradient',
  component: RadialGradient,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Canvas width={400} height={400}>
        <Story />
      </Canvas>
    ),
  ],
} satisfies Meta<typeof RadialGradient>;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicRadialExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <RadialGradient
        ref={updateRef}
        x={200}
        y={200}
        radius={80}
        stops={[
          { offset: 0, color: '#FFE66D' },
          { offset: 1, color: '#FF6B6B' }
        ]}
      />
      <Circle radius={80} fill={gradient} x={200} y={200} />
    </>
  );
}

function LargeRadiusExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <RadialGradient
        ref={updateRef}
        x={200}
        y={200}
        radius={150}
        stops={[
          { offset: 0, color: '#4ECDC4' },
          { offset: 1, color: '#AA96DA' }
        ]}
      />
      <Rectangle width={300} height={300} fill={gradient} x={200} y={200} />
    </>
  );
}

function MultiStopRadialExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <RadialGradient
        ref={updateRef}
        x={200}
        y={200}
        radius={100}
        stops={[
          { offset: 0, color: '#FFFFFF' },
          { offset: 0.5, color: '#00AEFF' },
          { offset: 1, color: '#000000' }
        ]}
      />
      <Circle radius={100} fill={gradient} x={200} y={200} />
    </>
  );
}

function OffsetCenterExample() {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo(() => (ref: any) => {
    if (ref) {
      setGradient(ref);
    }
  }, []);

  return (
    <>
      <RadialGradient
        ref={updateRef}
        x={150}
        y={150}
        radius={120}
        stops={[
          { offset: 0, color: '#95E1D3' },
          { offset: 1, color: '#F38181' }
        ]}
      />
      <Circle radius={80} fill={gradient} x={200} y={200} />
    </>
  );
}

export const Basic: Story = {
  render: () => <BasicRadialExample />,
};

export const LargeRadius: Story = {
  render: () => <LargeRadiusExample />,
};

export const MultipleStops: Story = {
  render: () => <MultiStopRadialExample />,
};

export const OffsetCenter: Story = {
  render: () => <OffsetCenterExample />,
};
