import { PlaygroundDefinition } from './types';
import { WiremarksPlayground } from './wiremarks/WiremarksPlayground';
import { ComponentsShowcasePlayground } from './components-showcase/ComponentsShowcasePlayground';
import { DiffsPlayground } from './diffs/DiffsPlayground';

export const PLAYGROUNDS: PlaygroundDefinition[] = [
  {
    id: 'wiremarks',
    name: 'Wiremarks',
    description: 'Declarative text-to-wireframe interactive diagramming tool',
    component: WiremarksPlayground,
  },
  {
    id: 'diffs',
    name: 'Diffs',
    description: 'Visually compare texts by shared vocabulary',
    component: DiffsPlayground,
  },
  {
    id: 'components-showcase',
    name: 'Components Showcase',
    description: 'Comprehensive grid demonstration of Two.js React primitives',
    component: ComponentsShowcasePlayground,
  },
];

export function getPlaygroundById(id: string): PlaygroundDefinition {
  const playground = PLAYGROUNDS.find((p) => p.id === id);
  return playground || PLAYGROUNDS[0];
}
