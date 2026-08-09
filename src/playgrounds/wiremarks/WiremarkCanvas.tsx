import { useEffect, useRef } from 'react';
import { useTwo, useFrame } from 'react-two.js';
import Two from 'two.js';
import { Wiremark } from './wiremark';
// @ts-expect-error - ZUI module path from two.js extras
import { ZUI } from 'two.js/extras/jsm/zui.js';
import type { Entity } from './entity';

const eventParams = { passive: false };

interface WiremarkCanvasProps {
  instructions: string;
}

interface ZUIInstance {
  scale: number;
  addLimits: (min: number, max: number) => void;
  translateSurface: (x: number, y: number) => void;
  zoomBy: (delta: number, x: number, y: number) => void;
  clientToSurface: (x: number, y: number) => { x: number; y: number; z: number };
}

export function WiremarkCanvas({ instructions }: WiremarkCanvasProps) {
  const { two, parent } = useTwo();
  const wiremarkRef = useRef<Wiremark | null>(null);
  const zuiRef = useRef<ZUIInstance | null>(null);
  const grabbingRef = useRef<string>('');

  useEffect(() => {
    if (!two || !parent) return;

    const wiremark = new Wiremark();
    parent.add(wiremark);
    wiremarkRef.current = wiremark;

    const domElement = two.renderer.domElement;
    // Pass domElement as viewport so ZUI correctly measures container position on page
    const zui: ZUIInstance = new ZUI(wiremark, domElement);
    zui.addLimits(0.06, 8);
    zuiRef.current = zui;

    const setGrabbing = (className: string) => {
      grabbingRef.current = className;
      const container = domElement.parentElement;
      if (container) {
        container.className = ['wireframe', className].filter(Boolean).join(' ');
      }
    };

    const getEntityUnderMouse = (clientX: number, clientY: number): Entity | null => {
      const pt = zui.clientToSurface(clientX, clientY);
      const { registry } = wiremark.entities;
      for (const name in registry) {
        const child = registry[name];
        const halfW = child.width / 2;
        const halfH = child.height / 2;
        if (
          pt.x >= child.position.x - halfW &&
          pt.x <= child.position.x + halfW &&
          pt.y >= child.position.y - halfH &&
          pt.y <= child.position.y + halfH
        ) {
          return child;
        }
      }
      return null;
    };

    const mouse = new Two.Vector();
    let touches: Touch[] = [];
    let moving: Entity | null = null;
    let distance = 0;

    function mousedown(e: MouseEvent) {
      setGrabbing('grabbing');
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      moving = getEntityUnderMouse(e.clientX, e.clientY);
      if (moving) {
        setGrabbing('dragging');
      }
      window.addEventListener('mousemove', mousemove, false);
      window.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(e: MouseEvent) {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      if (moving) {
        const newX = moving.position.x + dx / zui.scale;
        const newY = moving.position.y + dy / zui.scale;
        moving.position.set(newX, newY);
      } else {
        zui.translateSurface(dx, dy);
      }
      mouse.set(e.clientX, e.clientY);
    }

    function mouseup() {
      setGrabbing('');
      moving = null;
      window.removeEventListener('mousemove', mousemove, false);
      window.removeEventListener('mouseup', mouseup, false);
    }

    function mousewheel(e: WheelEvent) {
      const wheelE = e as WheelEvent & { wheelDeltaY?: number };
      const dy = (wheelE.wheelDeltaY ? wheelE.wheelDeltaY : -wheelE.deltaY) / 1000;
      zui.zoomBy(dy, e.clientX, e.clientY);
    }

    function touchstart(e: TouchEvent) {
      e.preventDefault();
      switch (e.touches.length) {
        case 2:
          pinchstart(e);
          break;
        case 1:
          panstart(e);
          break;
      }
    }

    function touchmove(e: TouchEvent) {
      e.preventDefault();
      switch (e.touches.length) {
        case 2:
          pinchmove(e);
          break;
        case 1:
          panmove(e);
          break;
      }
    }

    function touchend(e: TouchEvent) {
      e.preventDefault();
      setGrabbing('');
      moving = null;
      touches = [];
      const touch = e.touches[0];
      if (touch) {
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
      }
    }

    function panstart(e: TouchEvent) {
      const touch = e.touches[0];
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      moving = getEntityUnderMouse(touch.clientX, touch.clientY);
      if (moving) {
        setGrabbing('dragging');
      } else {
        setGrabbing('grabbing');
      }
    }

    function panmove(e: TouchEvent) {
      const touch = e.touches[0];
      const dx = touch.clientX - mouse.x;
      const dy = touch.clientY - mouse.y;
      if (moving) {
        const newX = moving.position.x + dx / zui.scale;
        const newY = moving.position.y + dy / zui.scale;
        moving.position.set(newX, newY);
      } else {
        zui.translateSurface(dx, dy);
      }
      mouse.set(touch.clientX, touch.clientY);
    }

    function pinchstart(e: TouchEvent) {
      for (let i = 0; i < e.touches.length; i++) {
        touches[i] = e.touches[i];
      }
      const a = touches[0];
      const b = touches[1];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      distance = Math.sqrt(dx * dx + dy * dy);
      mouse.x = dx / 2 + a.clientX;
      mouse.y = dy / 2 + a.clientY;
    }

    function pinchmove(e: TouchEvent) {
      for (let i = 0; i < e.touches.length; i++) {
        touches[i] = e.touches[i];
      }
      const a = touches[0];
      const b = touches[1];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      const d = Math.sqrt(dx * dx + dy * dy);
      const delta = d - distance;
      zui.zoomBy(delta / 250, mouse.x, mouse.y);
      distance = d;
    }

    if (window.navigator.maxTouchPoints <= 0) {
      domElement.addEventListener('mousedown', mousedown, eventParams);
      domElement.addEventListener('mousewheel', mousewheel as unknown as EventListener, eventParams);
      domElement.addEventListener('wheel', mousewheel as unknown as EventListener, eventParams);
    } else {
      domElement.addEventListener('touchstart', touchstart, eventParams);
      domElement.addEventListener('touchmove', touchmove, eventParams);
      domElement.addEventListener('touchend', touchend, eventParams);
      domElement.addEventListener('touchcancel', touchend, eventParams);
    }

    return () => {
      domElement.removeEventListener('mousedown', mousedown, eventParams);
      domElement.removeEventListener('mousewheel', mousewheel as unknown as EventListener, eventParams);
      domElement.removeEventListener('wheel', mousewheel as unknown as EventListener, eventParams);
      domElement.removeEventListener('touchstart', touchstart, eventParams);
      domElement.removeEventListener('touchmove', touchmove, eventParams);
      domElement.removeEventListener('touchend', touchend, eventParams);
      domElement.removeEventListener('touchcancel', touchend, eventParams);
      wiremark.remove().dispose();
    };
  }, [two, parent]);

  useEffect(() => {
    if (wiremarkRef.current && two) {
      wiremarkRef.current.instructions = instructions;
      two.update();
    }
  }, [instructions, two]);

  useFrame((_, frameDelta) => {
    if (wiremarkRef.current) {
      wiremarkRef.current.update(frameDelta);
    }
  });

  return null;
}
