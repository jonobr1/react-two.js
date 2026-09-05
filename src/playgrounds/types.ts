import { ComponentType } from 'react';

export interface PlaygroundProps {
  width?: number;
  height?: number;
}

export interface PlaygroundDefinition {
  id: string;
  name: string;
  description: string;
  component: ComponentType<PlaygroundProps>;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
}
