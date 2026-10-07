import test from 'node:test';
import assert from 'node:assert/strict';

import { bagArt, drinkArt } from '../product-art.mjs';

test('bagArt gives origins a stable, distinct packaging language', () => {
  assert.deepEqual(
    bagArt({ name: 'Yirgacheffe', origin: 'Ethiopia', type: 'single', hue: 42, roast: 1 }),
    {
      accent: 'hsl(42 68% 42%)',
      accentDeep: 'hsl(42 56% 25%)',
      accentSoft: 'hsl(42 72% 88%)',
      pattern: 'terrace',
      edition: 'Single origin',
      lot: 'LOT 042',
    },
  );
  assert.equal(bagArt({ name: 'Ember Blend', origin: 'House espresso', type: 'blend', hue: 12, roast: 4 }).pattern, 'orbit');
  assert.equal(bagArt({ name: 'Night Owl', origin: 'Swiss water decaf', type: 'decaf', hue: 225, roast: 3 }).pattern, 'night');
});

test('drinkArt creates readable product-stage colors from the drink palette', () => {
  assert.deepEqual(
    drinkArt({ name: 'Caramel Cloud', bg: '#d88a45', ink: '#2b140a' }, 0),
    {
      accent: '#d88a45',
      ink: '#2b140a',
      number: '01',
      label: 'House signature',
    },
  );
  assert.equal(drinkArt({ name: 'Butterfly Pea Lemonade', bg: '#4c63d2', ink: '#f2f4ff' }, 11).number, '12');
});
