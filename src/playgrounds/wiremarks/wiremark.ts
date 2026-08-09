import Two from 'two.js';
import { Entity } from './entity';
import { unit, dashes } from './constants';

const emptyMatch = ['', ''];

export interface EntityRegistry {
  [name: string]: Entity;
}

export class EntitiesGroup extends Two.Group {
  registry: EntityRegistry = {};
}

export class Wiremark extends Two.Group {
  isWiremark = true;
  private _instructions: string | null = null;
  connections: Two.Group;
  entities: EntitiesGroup;

  constructor(instructions?: string) {
    super();

    this.connections = new Two.Group();
    this.connections.name = 'connections';

    this.entities = new EntitiesGroup();
    this.entities.name = 'entities';
    this.entities.registry = {};

    this.add(this.connections, this.entities);

    if (instructions) {
      this.instructions = instructions;
    }
  }

  /**
   * Parse instructions and layout new wireframe graph.
   */
  layout(): this {
    const { entities, instructions } = this;

    if (typeof instructions !== 'string') {
      return this;
    }

    const state: {
      entities: string[];
      connections: { [producer: string]: { name: string; target: string }[] };
    } = { entities: [], connections: {} };

    const lines = instructions.split(/\n/i);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length <= 0 || /^#/.test(line)) {
        continue;
      }

      const producerMatch = line.match(/^([^-]+)[-$]/) || emptyMatch;
      const currencyMatch = line.match(/\[([^\]]+)\]/) || emptyMatch;
      const consumerMatch = line.match(/->(.+)$/) || emptyMatch;

      const producer = producerMatch[1].trim();
      const currency = currencyMatch[1].trim();
      const consumer = consumerMatch[1].trim();

      const producerExists = producer.length > 0;
      const currencyExists = currency.length > 0;
      const consumerExists = consumer.length > 0;

      if (producerExists) {
        if (state.entities.indexOf(producer) < 0) {
          state.entities.push(producer);
        }
      }
      if (consumerExists) {
        if (state.entities.indexOf(consumer) < 0) {
          state.entities.push(consumer);
        }
      }

      if (producerExists && consumerExists) {
        if (!(producer in state.connections)) {
          state.connections[producer] = [];
        }
        state.connections[producer].push({
          name: currencyExists ? currency : 'connection',
          target: consumer,
        });
      }
    }

    const length = Math.max(entities.children.length, state.entities.length);

    for (let i = 0; i < length; i++) {
      const name = state.entities[i];
      let entity = entities.children[i] as Entity | undefined;

      if (entity) {
        if (state.entities.indexOf(entity.name) < 0) {
          if (typeof name === 'undefined') {
            // Too many entities, delete the extras!
            delete entities.registry[entity.name];
            entity.remove().dispose();
            entity = undefined;
          } else {
            entity.name = name;
            entities.registry[name] = entity;
          }
        }
      } else if (typeof name !== 'undefined') {
        entity = new Entity(name);
        entity.position.x = i * entity.width + unit * 0.25;
        entity.position.y = 2 * (i % 2) * entity.height + entity.height;
        entities.add(entity);
        entities.registry[name] = entity;
      }
    }

    for (let i = 0; i < entities.children.length; i++) {
      const entity = entities.children[i] as Entity;
      const connections = state.connections[entity.name];

      entity.reset();

      if (typeof connections !== 'undefined' && connections.length > 0) {
        for (let j = 0; j < connections.length; j++) {
          const { name: connName, target } = connections[j];
          entity.connect(target, connName);
        }
      }
    }

    return this;
  }

  update(timeDelta: number): this {
    dashes.offset -= timeDelta / 10;
    return this;
  }

  dispose(): void {}

  get instructions(): string | null {
    return this._instructions;
  }
  set instructions(instructions: string | null) {
    this._instructions = instructions;
    this.layout();
  }
}
