import {
  GraphData,
  ParsedBlock,
  ParsedNode,
  WiremarkEdge,
  NodeColors,
} from './types';
import { nodeWidth, nodeHeight } from './constants';
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

/** A line of three or more hyphens, and nothing else, starts a new block. */
const BLOCK_SEPARATOR = /^-{3,}$/;

/**
 * Entity names are canonical only within a block, so the same name in two
 * blocks is two entities. Ids carry an occurrence ordinal behind a NUL,
 * which cannot be typed into a name. Ids are internal — `name` is displayed.
 */
const ID_SEPARATOR = '\u0000';

interface RawConnection {
  producer: string;
  consumer: string;
  label?: string;
}

export function parseWiremarksDSL(instructions: string): GraphData {
  if (typeof instructions !== 'string') {
    return { nodes: [], edges: [], blocks: [] };
  }

  // Split into blocks. Blank lines are cosmetic; comments are ignored.
  const blockLines: string[][] = [[]];
  for (const rawLine of instructions.split(/\n/)) {
    const line = rawLine.trim();

    if (BLOCK_SEPARATOR.test(line)) {
      blockLines.push([]);
      continue;
    }
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    blockLines[blockLines.length - 1].push(line);
  }

  const nodes: ParsedNode[] = [];
  const edges: WiremarkEdge[] = [];
  const blocks: ParsedBlock[] = [];

  // How many blocks so far have mentioned each name.
  const occurrences = new Map<string, number>();

  for (const lines of blockLines) {
    const namesInBlock: string[] = [];
    const connections: RawConnection[] = [];

    for (const line of lines) {
      const producerMatch = line.match(/^(.*?)(?:->|-\[)/) || emptyMatch;
      const currencyMatch = line.match(/\[([^\]]+)\]/) || emptyMatch;
      const consumerMatch = line.match(/->(.+)$/) || emptyMatch;

      const producer = producerMatch[1].trim();
      const currency = currencyMatch[1].trim();
      const consumer = consumerMatch[1].trim();

      if (producer.length > 0 && !namesInBlock.includes(producer)) {
        namesInBlock.push(producer);
      }
      if (consumer.length > 0 && !namesInBlock.includes(consumer)) {
        namesInBlock.push(consumer);
      }

      if (producer.length > 0 && consumer.length > 0) {
        connections.push({
          producer,
          consumer,
          label: currency.length > 0 ? currency : undefined,
        });
      }
    }

    if (namesInBlock.length === 0) {
      continue;
    }

    const idsByName = new Map<string, string>();
    for (const name of namesInBlock) {
      const occurrence = (occurrences.get(name) ?? 0) + 1;
      occurrences.set(name, occurrence);

      const id = `${name}${ID_SEPARATOR}${occurrence}`;
      idsByName.set(name, id);

      nodes.push({
        id,
        name,
        width: nodeWidth,
        height: nodeHeight,
        colors: generateNodeColors(name),
      });
    }

    const blockEdges: WiremarkEdge[] = connections.map((conn, index) => {
      const label = conn.label || 'connection';
      const sourceId = idsByName.get(conn.producer)!;
      const targetId = idsByName.get(conn.consumer)!;

      return {
        id: `${sourceId}->${targetId}-${edges.length + index}`,
        sourceId,
        targetId,
        label: conn.label,
        color: stringToColor(label),
      };
    });

    edges.push(...blockEdges);
    blocks.push({
      nodeIds: namesInBlock.map((name) => idsByName.get(name)!),
      edges: blockEdges,
    });
  }

  return { nodes, edges, blocks };
}
