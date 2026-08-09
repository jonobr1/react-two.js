import Two from 'two.js';
import { stringToColor } from './utils/color';
import { unit, dashes, textStyles } from './constants';
import type { Entity } from './entity';

const HALF_PI = Math.PI * 0.5;

export class Connection extends Two.Group {
  private _name = 'connection';
  offset = new Two.Vector();
  source: Entity;
  target: Entity;
  path: Two.Path;
  label?: Two.Text;
  private _updateHandler: () => void;

  constructor(source: Entity, target: Entity, name?: string) {
    const points = [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
    ];

    super();

    this.source = source;
    this.target = target;

    const path = (this.path = new Two.Path(points));
    path.curved = true;
    path.linewidth = unit * 0.015;
    path.noFill();
    path.stroke = 'black';
    path.dashes = dashes;
    path.join = 'round';
    path.cap = 'round';

    if (typeof name === 'string' && name.length > 0) {
      const label = (this.label = new Two.Text(name, 0, 0, textStyles));
      label.size *= 0.75;
      this._name = name;
      this.add(label);
    }

    const update = () => {
      points[0].copy(this.source.position).add(this.offset);
      points[1].copy(this.source.position).add(this.offset);
      points[1].x += this.source.width * 0.5;
      points[2].copy(this.target.position);
      points[2].x -= this.target.width * 0.5;
      points[3].copy(this.target.position);

      if (this.label) {
        const a = path.getPointAt(0.45);
        const b = path.getPointAt(0.55);
        if (a && b) {
          const angle = Two.Vector.angleBetween(b, a);

          const ox = this.label.size * Math.cos(angle - HALF_PI);
          const oy = this.label.size * Math.sin(angle - HALF_PI);

          this.label.position.x = 0.5 * (b.x - a.x) + a.x + ox;
          this.label.position.y = 0.5 * (b.y - a.y) + a.y + oy;
          this.label.rotation = angle;
        }
      }
    };

    this._updateHandler = update;

    this.offset.bind('change', update);
    source.position.bind('change', update);
    target.position.bind('change', update);

    this.add(path);

    if (name) {
      this.name = name;
    }

    requestAnimationFrame(update);
  }

  dispose() {
    this.source.position.unbind('change', this._updateHandler);
    this.target.position.unbind('change', this._updateHandler);
    return this;
  }

  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._name = name;
    const color = stringToColor(name);
    if (this.label) {
      this.label.fill = color;
    }
    if (this.path) {
      this.path.stroke = color;
    }
  }
}
