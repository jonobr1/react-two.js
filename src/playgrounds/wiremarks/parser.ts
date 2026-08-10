import { GraphData, WiremarkNode, WiremarkEdge, NodeColors } from './types';
import { unit } from './constants';
import { dilute, stringToColor } from './utils/color';

function generateNodeColors(name: string): NodeColors {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const alpha = 0.66;
  const r = Math.abs((hash & 0xff0000) >> 16) % 256;
  const g = Math.abs((hash & 0x00ff00) >> 8) % 256;
  const b = Math.abs(hash & 0x0000ff) % 256;

  const dr = Math.round(dilute(r, alpha));
  const dg = Math.round(dilute(g, alpha));
  const db = Math.round(dilute(b, alpha));

  const isLight = (r + g + b) / 3 >= 255 * 0.4;

  return {
    fill: `rgb(${dr}, ${dg}, ${db})`,
    stroke: `rgb(${r}, ${g}, ${b})`,
    textColor: isLight ? 'black' : 'white',
  };
}

const emptyMatch = ['', ''];

export function parseWiremarksDSL(instructions: string): GraphData {
  if (typeof instructions !== 'string') {
    return { nodes: [], edges: [] };
  }

  const rawEntityNames: string[] = [];
  const rawConnections: {
    producer: string;
    consumer: string;
    label?: string;
  }[] = [];

  const lines = instructions.split(/\n/i);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const producerMatch = line.match(/^(.*?)(?:->|-\[)/) || emptyMatch;
    const currencyMatch = line.match(/\[([^\]]+)\]/) || emptyMatch;
    const consumerMatch = line.match(/->(.+)$/) || emptyMatch;

    const producer = producerMatch[1].trim();
    const currency = currencyMatch[1].trim();
    const consumer = consumerMatch[1].trim();

    const producerExists = producer.length > 0;
    const currencyExists = currency.length > 0;
    const consumerExists = consumer.length > 0;

    if (producerExists && !rawEntityNames.includes(producer)) {
      rawEntityNames.push(producer);
    }
    if (consumerExists && !rawEntityNames.includes(consumer)) {
      rawEntityNames.push(consumer);
    }

    if (producerExists && consumerExists) {
      rawConnections.push({
        producer,
        consumer,
        label: currencyExists ? currency : undefined,
      });
    }
  }

  const nodeWidth = unit * 1.5;
  const nodeHeight = unit;

  const nodes: WiremarkNode[] = rawEntityNames.map((name, index) => {
    const x = index * nodeWidth + unit * 0.25;
    const y = 2 * (index % 2) * nodeHeight + nodeHeight;

    return {
      id: name,
      name,
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      colors: generateNodeColors(name),
    };
  });

  const edges: WiremarkEdge[] = rawConnections.map((conn, index) => {
    const label = conn.label || 'connection';
    return {
      id: `${conn.producer}->${conn.consumer}-${index}`,
      sourceId: conn.producer,
      targetId: conn.consumer,
      label: conn.label,
      color: stringToColor(label),
    };
  });

  return { nodes, edges };
}
