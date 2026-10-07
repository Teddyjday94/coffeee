const pad = (value) => String(Math.round(value)).padStart(3, '0');

export function bagArt(bean) {
  const hue = Number(bean.hue) || 0;
  let pattern;
  if (bean.type === 'decaf') pattern = 'night';
  else if (bean.type === 'blend') pattern = 'orbit';
  else if (hue < 60) pattern = 'terrace';
  else if (hue < 140) pattern = 'contour';
  else if (hue < 220) pattern = 'botanical';
  else if (hue < 300) pattern = 'mosaic';
  else pattern = 'sunburst';

  return {
    accent: `hsl(${hue} 68% 42%)`,
    accentDeep: `hsl(${hue} 56% 25%)`,
    accentSoft: `hsl(${hue} 72% 88%)`,
    pattern,
    edition: bean.type === 'single' ? 'Single origin' : bean.type === 'decaf' ? 'Water process' : 'Roaster blend',
    lot: `LOT ${pad(hue)}`,
  };
}

export function drinkArt(drink, index = 0) {
  return {
    accent: drink.bg,
    ink: drink.ink,
    number: String(index + 1).padStart(2, '0'),
    label: 'House signature',
  };
}
