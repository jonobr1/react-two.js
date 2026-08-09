import Two from 'two.js';
import { Connection } from './connection';
import { dilute } from './utils/color';
import { unit, textStyles } from './constants';

export class Entity extends Two.Group {
  static Instances: Entity[] = [];

  connections: Connection[] = [];
  shape: Two.RoundedRectangle;
  textLabel: Two.Text;

  constructor(name: string) {
    super();

    const shape = (this.shape = new Two.RoundedRectangle(
      0,
      0,
      unit * 1.5,
      unit,
      8
    ));
    const textLabel = (this.textLabel = new Two.Text(name, 0, 0, textStyles));

    shape.noStroke();

    const alpha = 0.66;
    const r = Math.random() * 255;
    const g = Math.random() * 255;
    const b = Math.random() * 255;

    const dr = dilute(r, alpha);
    const dg = dilute(g, alpha);
    const db = dilute(b, alpha);

    shape.fill = `rgb(${dr}, ${dg}, ${db})`;
    shape.stroke = `rgb(${r}, ${g}, ${b})`;
    shape.linewidth = unit * 0.015;

    if ((r + g + b) / 3 >= 255 * 0.4) {
      textLabel.fill = 'black';
    }

    this.add(shape, textLabel);

    Entity.Instances.push(this);
  }

  static getEntityByName(name: string): Entity | null {
    for (let i = 0; i < Entity.Instances.length; i++) {
      const entity = Entity.Instances[i];
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }

  static getInstanceIndex(entity: Entity): number {
    for (let i = 0; i < Entity.Instances.length; i++) {
      const e = Entity.Instances[i];
      if (e.id === entity.id) {
        return i;
      }
    }
    return -1;
  }

  static getRoot(item: Two.Object | null): Two.Object | null {
    let current = item;
    while (current && current.parent && !(current as { isWiremark?: boolean }).isWiremark) {
      current = current.parent;
    }
    return current;
  }

  connect(name: string, means?: string): this {
    const target = Entity.getEntityByName(name);

    if (!means) {
      means = 'connection';
    }

    if (target) {
      let isConnected = false;
      for (let i = 0; i < this.connections.length; i++) {
        const c = this.connections[i];
        if (c.target.id === target.id && means === c.name) {
          isConnected = true;
          break;
        }
      }
      if (!isConnected) {
        const connection = new Connection(this, target, means);
        const root = Entity.getRoot(this);
        if (root && root.connections) {
          root.connections.add(connection);
        }
        this.connections.push(connection);
        for (let i = 0; i < this.connections.length; i++) {
          const c = this.connections[i];
          const pct = (i + 0.5) / this.connections.length;
          const y = pct * this.height - this.height * 0.5;
          c.offset.y = y;
        }
      }
    } else {
      console.warn('Entity: no target found for name:', name);
    }

    return this;
  }

  reset(): this {
    for (let i = 0; i < this.connections.length; i++) {
      this.connections[i].remove().dispose();
    }
    this.connections.length = 0;
    return this;
  }

  remove(): this {
    super.remove();
    for (let i = 0; i < this.connections.length; i++) {
      const c = this.connections[i];
      c.remove().dispose();
    }
    const index = Entity.getInstanceIndex(this);
    if (index >= 0) {
      Entity.Instances.splice(index, 1);
    }
    return this;
  }

  dispose(): void {}

  get width(): number {
    return this.shape.width;
  }
  get height(): number {
    return this.shape.height;
  }
  get name(): string {
    return this.textLabel.value;
  }
  set name(name: string) {
    this.textLabel.value = name;
  }
}
