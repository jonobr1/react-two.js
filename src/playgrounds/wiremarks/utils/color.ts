export function lerp(source: number, target: number, t: number): number {
  return (target - source) * t + source;
}

export function dilute(component: number, amount: number): number {
  return lerp(component, 255, amount);
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substring(value.toString(16).length > 2 ? 0 : 0).slice(-2);
  }
  return color;
}
