import { getPlaygroundById } from './playgrounds/registry';

interface PlaygroundProps {
  width?: number;
  height?: number;
  activePlaygroundId?: string;
}

export default function Playground({
  width,
  height,
  activePlaygroundId = 'wiremarks',
}: PlaygroundProps) {
  const playgroundDef = getPlaygroundById(activePlaygroundId);
  const ActiveComponent = playgroundDef.component;

  return <ActiveComponent width={width} height={height} />;
}
