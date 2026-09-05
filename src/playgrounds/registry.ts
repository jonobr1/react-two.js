import { PlaygroundDefinition } from './types';
import { WiremarksPlayground } from './wiremarks/WiremarksPlayground';
import { ComponentsShowcasePlayground } from './components-showcase/ComponentsShowcasePlayground';
import { DiffsPlayground } from './diffs/DiffsPlayground';
import {
  ShareIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from '@heroicons/react/20/solid';

export const PLAYGROUNDS: PlaygroundDefinition[] = [
  {
    id: 'wiremarks',
    name: 'Wiremarks',
    description: 'Declarative text-to-wireframe interactive diagramming tool',
    component: WiremarksPlayground,
    icon: ShareIcon,
  },
  {
    id: 'diffs',
    name: 'Diffs',
    description: 'Visually compare texts by shared vocabulary',
    component: DiffsPlayground,
    icon: ViewColumnsIcon,
  },
  {
    id: 'components-showcase',
    name: 'Components Showcase',
    description: 'Grid demonstration of Two.js React primitives',
    component: ComponentsShowcasePlayground,
    icon: Squares2X2Icon,
  },
];

export function getPlaygroundById(id: string): PlaygroundDefinition {
  const playground = PLAYGROUNDS.find((p) => p.id === id);
  return playground || PLAYGROUNDS[0];
}
