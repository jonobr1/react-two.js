import { describe, it, expect, expectTypeOf } from 'vitest';
import React, { createRef } from 'react';
import { render, act } from '@testing-library/react';
import Two from 'two.js';
import {
  Canvas,
  Group,
  SVG,
  Path,
  Points,
  Text,
  ArcSegment,
  Circle,
  Ellipse,
  Image,
  ImageSequence,
  Line,
  Polygon,
  Rectangle,
  RoundedRectangle,
  Sprite,
  Star,
  LinearGradient,
  RadialGradient,
  Texture,
  PROPERTY_MATRIX,
  SUPPORTED_TWO_VERSION,
  type RefPath,
  type RefGroup,
  type RefText,
  type RefPoints,
  type RefRectangle,
  type RefCircle,
  type RefImage,
  type RefSprite,
  type RefImageSequence,
  type RefSVG,
  type PathProps,
  type GroupProps,
  type TextProps,
  type PointsProps,
  type RectangleProps,
  type SpriteProps,
  type ImageProps,
  type ImageSequenceProps,
} from '../lib/main';

describe('Property Matrix & Declarative Coverage (Issue #30)', () => {
  describe('Compile-Time Type Tests', () => {
    it('should include mask, clip, and strokeAttenuation in PathProps', () => {
      expectTypeOf<'mask'>().toExtend<PathProps>();
      expectTypeOf<'clip'>().toExtend<PathProps>();
      expectTypeOf<'strokeAttenuation'>().toExtend<PathProps>();
    });

    it('should include mask, beginning, ending, and strokeAttenuation in GroupProps', () => {
      expectTypeOf<'mask'>().toExtend<GroupProps>();
      expectTypeOf<'beginning'>().toExtend<GroupProps>();
      expectTypeOf<'ending'>().toExtend<GroupProps>();
      expectTypeOf<'strokeAttenuation'>().toExtend<GroupProps>();
    });

    it('should include mask, clip, and strokeAttenuation in TextProps', () => {
      expectTypeOf<'mask'>().toExtend<TextProps>();
      expectTypeOf<'clip'>().toExtend<TextProps>();
      expectTypeOf<'strokeAttenuation'>().toExtend<TextProps>();
    });

    it('should include strokeAttenuation in PointsProps', () => {
      expectTypeOf<'strokeAttenuation'>().toExtend<PointsProps>();
    });

    it('should include origin in RectangleProps, ImageProps, SpriteProps, ImageSequenceProps', () => {
      expectTypeOf<'origin'>().toExtend<RectangleProps>();
      expectTypeOf<'origin'>().toExtend<ImageProps>();
      expectTypeOf<'origin'>().toExtend<SpriteProps>();
      expectTypeOf<'origin'>().toExtend<ImageSequenceProps>();
    });

    it('should type check Rectangle origin accepting Vector, object literal, and tuple', () => {
      type RectProps = React.ComponentProps<typeof Rectangle>;
      expectTypeOf<{ origin?: Two.Vector }>().toExtend<RectProps>();
      expectTypeOf<{ origin?: { x?: number; y?: number } }>().toExtend<RectProps>();
      expectTypeOf<{ origin?: [number, number] }>().toExtend<RectProps>();
    });

    it('should type check Sprite src accepting string or Two.Texture', () => {
      type SprProps = React.ComponentProps<typeof Sprite>;
      expectTypeOf<{ src?: string }>().toExtend<SprProps>();
      expectTypeOf<{ src?: InstanceType<typeof Two.Texture> }>().toExtend<SprProps>();
    });

    it('should type check Path mask, clip, and strokeAttenuation props', () => {
      type PProps = React.ComponentProps<typeof Path>;
      expectTypeOf<{ mask?: InstanceType<typeof Two.Shape> | null }>().toExtend<PProps>();
      expectTypeOf<{ clip?: boolean }>().toExtend<PProps>();
      expectTypeOf<{ strokeAttenuation?: boolean }>().toExtend<PProps>();
    });

    it('should type check Group mask, beginning, ending, and strokeAttenuation props', () => {
      type GProps = React.ComponentProps<typeof Group>;
      expectTypeOf<{ mask?: InstanceType<typeof Two.Shape> | null }>().toExtend<GProps>();
      expectTypeOf<{ beginning?: number }>().toExtend<GProps>();
      expectTypeOf<{ ending?: number }>().toExtend<GProps>();
      expectTypeOf<{ strokeAttenuation?: boolean }>().toExtend<GProps>();
    });
  });

  describe('Property Matrix Definition', () => {
    it('should verify supported Two.js version is 0.8.23', () => {
      expect(SUPPORTED_TWO_VERSION).toBe('0.8.23');
    });

    it('should contain entries for all 19 exported components', () => {
      const expectedComponents = [
        'Group',
        'SVG',
        'Path',
        'Rectangle',
        'Circle',
        'Ellipse',
        'Line',
        'Polygon',
        'RoundedRectangle',
        'Star',
        'ArcSegment',
        'Points',
        'Text',
        'Image',
        'Sprite',
        'ImageSequence',
        'LinearGradient',
        'RadialGradient',
        'Texture',
      ];

      for (const name of expectedComponents) {
        expect(PROPERTY_MATRIX[name]).toBeDefined();
        expect(PROPERTY_MATRIX[name].component).toBe(name);
        expect(PROPERTY_MATRIX[name].supportedProps.length).toBeGreaterThan(0);
        expect(PROPERTY_MATRIX[name].omittedProps.length).toBeGreaterThan(0);
      }
    });

    it('should document intentional omissions with reasons for every component', () => {
      for (const compName in PROPERTY_MATRIX) {
        const matrix = PROPERTY_MATRIX[compName];
        for (const omission of matrix.omittedProps) {
          expect(omission.property).toBeTruthy();
          expect(['read-only', 'renderer-internal', 'managed-by-react', 'imperative-method']).toContain(
            omission.reason
          );
          expect(omission.description).toBeTruthy();
        }
      }
    });
  });

  describe('Runtime Declarative Prop Updates', () => {
    it('should apply mask and clip on Path declaratively', () => {
      const pathRef = createRef<RefPath>();
      const maskShape = new Two.Circle(0, 0, 50);

      render(
        <Canvas>
          <Path ref={pathRef} mask={maskShape} clip={true} />
        </Canvas>
      );

      expect(pathRef.current).not.toBeNull();
      expect(pathRef.current?.mask).toBe(maskShape);
      expect(maskShape.clip).toBe(true);
      expect(pathRef.current?.clip).toBe(true);
    });

    it('should apply mask on Group declaratively', () => {
      const groupRef = createRef<RefGroup>();
      const maskShape = new Two.Rectangle(0, 0, 100, 100);

      render(
        <Canvas>
          <Group ref={groupRef} mask={maskShape} />
        </Canvas>
      );

      expect(groupRef.current).not.toBeNull();
      expect(groupRef.current?.mask).toBe(maskShape);
      expect(maskShape.clip).toBe(true);
    });

    it('should apply mask and clip on Text declaratively', () => {
      const textRef = createRef<RefText>();
      const maskShape = new Two.Circle(0, 0, 30);

      render(
        <Canvas>
          <Text ref={textRef} value="Testing Mask" mask={maskShape} clip={true} />
        </Canvas>
      );

      expect(textRef.current).not.toBeNull();
      expect(textRef.current?.mask).toBe(maskShape);
      expect(textRef.current?.clip).toBe(true);
    });

    it('should apply strokeAttenuation across Path, Group, Text, Points, Circle', () => {
      const pathRef = createRef<RefPath>();
      const groupRef = createRef<RefGroup>();
      const textRef = createRef<RefText>();
      const pointsRef = createRef<RefPoints>();
      const circleRef = createRef<RefCircle>();

      render(
        <Canvas>
          <Path ref={pathRef} strokeAttenuation={false} />
          <Group ref={groupRef} strokeAttenuation={false} />
          <Text ref={textRef} strokeAttenuation={false} />
          <Points ref={pointsRef} strokeAttenuation={false} />
          <Circle ref={circleRef} strokeAttenuation={false} />
        </Canvas>
      );

      expect(pathRef.current?.strokeAttenuation).toBe(false);
      expect(groupRef.current?.strokeAttenuation).toBe(false);
      expect(textRef.current?.strokeAttenuation).toBe(false);
      expect(pointsRef.current?.strokeAttenuation).toBe(false);
      expect(circleRef.current?.strokeAttenuation).toBe(false);
    });

    it('should apply beginning and ending on Group and SVG declaratively', () => {
      const groupRef = createRef<RefGroup>();
      const svgRef = createRef<RefSVG>();

      render(
        <Canvas>
          <Group ref={groupRef} beginning={0.2} ending={0.8} />
          <SVG ref={svgRef} content="<svg></svg>" beginning={0.15} ending={0.85} />
        </Canvas>
      );

      expect(groupRef.current?.beginning).toBe(0.2);
      expect(groupRef.current?.ending).toBe(0.8);
      expect(svgRef.current?.beginning).toBe(0.15);
      expect(svgRef.current?.ending).toBe(0.85);
    });

    describe('Rectangle and derived shapes origin support', () => {
      it('should support origin as Two.Vector on Rectangle', () => {
        const rectRef = createRef<RefRectangle>();
        const originVec = new Two.Vector(25, 35);

        render(
          <Canvas>
            <Rectangle ref={rectRef} width={100} height={100} origin={originVec} />
          </Canvas>
        );

        expect(rectRef.current?.origin.x).toBe(25);
        expect(rectRef.current?.origin.y).toBe(35);
      });

      it('should support origin as object literal { x, y } on Rectangle', () => {
        const rectRef = createRef<RefRectangle>();

        render(
          <Canvas>
            <Rectangle ref={rectRef} width={100} height={100} origin={{ x: 50, y: 60 }} />
          </Canvas>
        );

        expect(rectRef.current?.origin.x).toBe(50);
        expect(rectRef.current?.origin.y).toBe(60);
      });

      it('should support origin as tuple [x, y] on Rectangle', () => {
        const rectRef = createRef<RefRectangle>();

        render(
          <Canvas>
            <Rectangle ref={rectRef} width={100} height={100} origin={[75, 85]} />
          </Canvas>
        );

        expect(rectRef.current?.origin.x).toBe(75);
        expect(rectRef.current?.origin.y).toBe(85);
      });

      it('should support origin on Image', () => {
        const imageRef = createRef<RefImage>();

        render(
          <Canvas>
            <Image ref={imageRef} origin={{ x: 10, y: 20 }} />
          </Canvas>
        );

        expect(imageRef.current?.origin.x).toBe(10);
        expect(imageRef.current?.origin.y).toBe(20);
      });

      it('should support origin on Sprite', () => {
        const spriteRef = createRef<RefSprite>();

        render(
          <Canvas>
            <Sprite ref={spriteRef} origin={[30, 40]} />
          </Canvas>
        );

        expect(spriteRef.current?.origin.x).toBe(30);
        expect(spriteRef.current?.origin.y).toBe(40);
      });

      it('should support origin on ImageSequence', () => {
        const seqRef = createRef<RefImageSequence>();

        render(
          <Canvas>
            <ImageSequence ref={seqRef} origin={new Two.Vector(50, 70)} />
          </Canvas>
        );

        expect(seqRef.current?.origin.x).toBe(50);
        expect(seqRef.current?.origin.y).toBe(70);
      });
    });

    describe('Sprite src with Two.Texture', () => {
      it('should accept Two.Texture as Sprite src', () => {
        const spriteRef = createRef<RefSprite>();
        const texture = new Two.Texture();

        render(
          <Canvas>
            <Sprite ref={spriteRef} src={texture} />
          </Canvas>
        );

        expect(spriteRef.current?.texture).toBe(texture);
      });
    });

    describe('Dynamic prop updates', () => {
      it('should update strokeAttenuation dynamically on re-render', () => {
        const pathRef = createRef<RefPath>();

        const { rerender } = render(
          <Canvas>
            <Path ref={pathRef} strokeAttenuation={true} />
          </Canvas>
        );

        expect(pathRef.current?.strokeAttenuation).toBe(true);

        act(() => {
          rerender(
            <Canvas>
              <Path ref={pathRef} strokeAttenuation={false} />
            </Canvas>
          );
        });

        expect(pathRef.current?.strokeAttenuation).toBe(false);
      });

      it('should update origin dynamically on re-render', () => {
        const rectRef = createRef<RefRectangle>();

        const { rerender } = render(
          <Canvas>
            <Rectangle ref={rectRef} width={100} height={100} origin={{ x: 10, y: 10 }} />
          </Canvas>
        );

        expect(rectRef.current?.origin.x).toBe(10);
        expect(rectRef.current?.origin.y).toBe(10);

        act(() => {
          rerender(
            <Canvas>
              <Rectangle ref={rectRef} width={100} height={100} origin={{ x: 90, y: 90 }} />
            </Canvas>
          );
        });

        expect(rectRef.current?.origin.x).toBe(90);
        expect(rectRef.current?.origin.y).toBe(90);
      });
    });

    describe('Primitives and Gradients coverage', () => {
      it('should render all primitives and gradients inside Canvas with props', () => {
        render(
          <Canvas>
            <ArcSegment startAngle={0} endAngle={Math.PI} innerRadius={10} outerRadius={20} />
            <Ellipse width={50} height={30} />
            <Line x1={0} y1={0} x2={100} y2={100} />
            <Polygon radius={40} sides={5} />
            <RoundedRectangle width={80} height={60} radius={10} />
            <Star innerRadius={15} outerRadius={30} sides={5} />
            <LinearGradient x1={0} y1={0} x2={100} y2={100} />
            <RadialGradient x={50} y={50} radius={50} />
            <Texture />
          </Canvas>
        );
      });
    });
  });
});
