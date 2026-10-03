// All copy and data for the site lives here, so the shop can be rebranded
// without touching the 3D code. Everything below is placeholder content.

// liquid: two-tone pour, bottom → top. split = where the colours meet (0–1).
// topping: { type: 'foam' | 'whip', color, drizzle? } or null.
// fx: ingredients that burst around the cup. Types: bean, leaf, berry, slice,
//     cube, chip, bud, stick (see scene.js).
export const DRINKS = [
  {
    name: 'Caramel Cloud', price: 5.5, desc: 'Espresso · salted caramel · cold foam',
    bg: '#d88a45', ink: '#2b140a',
    liquid: { bottom: '#f3dcc0', top: '#8f4a1c', split: 0.5 }, straw: '#2b140a',
    topping: { type: 'foam', color: '#f8ecda', drizzle: '#b5641c' },
    fx: [{ type: 'cube', colors: ['#e9a648', '#c97d2a'], count: 10 }, { type: 'bean', colors: ['#4a2616'], count: 8 }],
  },
  {
    name: 'Matcha Meadow', price: 5.75, desc: 'Ceremonial matcha · oat milk · vanilla',
    bg: '#8cb259', ink: '#1c2810',
    liquid: { bottom: '#f1ede0', top: '#5f8f25', split: 0.55 }, straw: '#f4f0e4',
    topping: null,
    fx: [{ type: 'leaf', colors: ['#5c8c28', '#7cab3a', '#476f1e'], count: 18 }],
  },
  {
    name: 'Mocha Midnight', price: 5.95, desc: 'Espresso · dark chocolate · whipped cream',
    bg: '#5b3426', ink: '#f6e7d8',
    liquid: { bottom: '#d9b494', top: '#3a1d10', split: 0.45 }, straw: '#f6e7d8',
    topping: { type: 'whip', color: '#fbf4ea', drizzle: '#3b1c0f' },
    fx: [{ type: 'chip', colors: ['#2a140b', '#4a2414'], count: 14 }, { type: 'bean', colors: ['#5a2e18'], count: 6 }],
  },
  {
    name: 'Berry Bloom', price: 5.95, desc: 'Strawberry · hibiscus · whole milk',
    bg: '#e0607c', ink: '#3a0d18',
    liquid: { bottom: '#f8d3dc', top: '#bd2648', split: 0.45 }, straw: '#3a0d18',
    topping: null,
    fx: [{ type: 'berry', colors: ['#c21f3a', '#e0425a', '#8e1028'], count: 13 }, { type: 'leaf', colors: ['#3f7a2a'], count: 5 }],
  },
  {
    name: 'Honey Lavender', price: 5.75, desc: 'Espresso · wildflower honey · lavender',
    bg: '#b9a3de', ink: '#25163d',
    liquid: { bottom: '#f3ecfb', top: '#b88a4a', split: 0.5 }, straw: '#25163d',
    topping: { type: 'foam', color: '#f1e8fb', drizzle: '#e0a632' },
    fx: [{ type: 'bud', colors: ['#7d5bb8', '#9b7fd0', '#5e3f96'], count: 16 }, { type: 'cube', colors: ['#f0b43c'], count: 6 }],
  },
  {
    name: 'Orange Ember', price: 5.25, desc: 'Cold brew · blood orange · tonic',
    bg: '#ec8a2f', ink: '#2e1406',
    liquid: { bottom: '#f6a64a', top: '#4a1f0c', split: 0.42 }, straw: '#2e1406',
    topping: null,
    fx: [{ type: 'slice', colors: ['#ffffff'], count: 12 }, { type: 'bean', colors: ['#4a2616'], count: 5 }],
  },
  {
    name: 'Coconut Cold Brew', price: 5.5, desc: '18-hour cold brew · coconut cream',
    bg: '#3e6e68', ink: '#f3ecdc',
    liquid: { bottom: '#f3efe6', top: '#2f1a10', split: 0.38 }, straw: '#f3ecdc',
    topping: { type: 'foam', color: '#fbf8f0' },
    fx: [{ type: 'chip', colors: ['#fbf7ee', '#efe6d4'], count: 12 }, { type: 'bean', colors: ['#4a2616'], count: 7 }],
  },
  {
    name: 'Chai Spice', price: 5.25, desc: 'House chai · black tea · cinnamon foam',
    bg: '#c4572e', ink: '#2a0f06',
    liquid: { bottom: '#f2d8b8', top: '#a8652f', split: 0.5 }, straw: '#2a0f06',
    topping: { type: 'foam', color: '#f4e1c6', drizzle: '#8a4a22' },
    fx: [{ type: 'stick', colors: ['#8a4a22', '#a35a2a'], count: 8 }, { type: 'bud', colors: ['#5a2e14'], count: 8 }],
  },
  {
    name: 'Ube Velvet', price: 5.95, desc: 'Purple yam · coconut cream · blackberry',
    bg: '#9a7bcf', ink: '#1f1233',
    liquid: { bottom: '#efe6f8', top: '#7f50c0', split: 0.5 }, straw: '#efe6f8',
    topping: { type: 'foam', color: '#e9dcf8' },
    fx: [{ type: 'berry', colors: ['#2b1a3d', '#4a2a6b'], count: 11 }, { type: 'leaf', colors: ['#c9a8ef', '#e7d6fb'], count: 8 }],
  },
];

export const LARGE_UPCHARGE = 0.75;

// type: blend | single | decaf (drives the filter chips)
// paper: kraft | black | white (the bag stock). roast: 1 light → 5 dark.
export const BEANS = [
  { name: 'Ember Blend', origin: 'House espresso', process: 'Brazil · Colombia · Ethiopia', notes: 'Dark chocolate, cherry, molasses', hue: 12, price: 18, type: 'blend', paper: 'black', roast: 4 },
  { name: 'Morning Oak', origin: 'Breakfast blend', process: 'Brazil · Guatemala', notes: 'Milk chocolate, hazelnut, honey', hue: 28, price: 17, type: 'blend', paper: 'kraft', roast: 3 },
  { name: 'Yirgacheffe', origin: 'Ethiopia', process: 'Washed · Heirloom', notes: 'Jasmine, bergamot, lemon curd', hue: 42, price: 21, type: 'single', paper: 'white', roast: 1 },
  { name: 'Sidama', origin: 'Ethiopia', process: 'Natural · Heirloom', notes: 'Blueberry, cacao nib, rose', hue: 330, price: 22, type: 'single', paper: 'kraft', roast: 2 },
  { name: 'Huila', origin: 'Colombia', process: 'Washed · Caturra', notes: 'Caramel, red apple, cocoa', hue: 150, price: 19, type: 'single', paper: 'kraft', roast: 2 },
  { name: 'Nyeri AA', origin: 'Kenya', process: 'Washed · SL28', notes: 'Blackcurrant, grapefruit, cane sugar', hue: 350, price: 23, type: 'single', paper: 'white', roast: 2 },
  { name: 'Antigua', origin: 'Guatemala', process: 'Washed · Bourbon', notes: 'Toffee, orange zest, almond', hue: 200, price: 19, type: 'single', paper: 'kraft', roast: 3 },
  { name: 'Tarrazú', origin: 'Costa Rica', process: 'Honey · Catuaí', notes: 'Brown sugar, apricot, vanilla', hue: 52, price: 20, type: 'single', paper: 'white', roast: 2 },
  { name: 'Cerrado', origin: 'Brazil', process: 'Natural · Mundo Novo', notes: 'Peanut brittle, cocoa, raisin', hue: 95, price: 17, type: 'single', paper: 'black', roast: 3 },
  { name: 'Mandheling', origin: 'Sumatra', process: 'Wet-hulled · Typica', notes: 'Cedar, dark cocoa, clove', hue: 270, price: 20, type: 'single', paper: 'black', roast: 4 },
  { name: 'Gesha Reserve', origin: 'Panama', process: 'Washed · Gesha', notes: 'Peach, jasmine, honeycomb', hue: 175, price: 38, type: 'single', paper: 'white', roast: 1, badge: 'Reserve' },
  { name: 'Night Owl', origin: 'Swiss water decaf', process: 'Colombia · Decaf', notes: 'Brown sugar, cocoa, plum', hue: 225, price: 19, type: 'decaf', paper: 'black', roast: 3 },
];

export const GRINDS = ['Whole bean', 'Espresso', 'Pour over', 'French press', 'Drip'];

// days: 0 = Sunday … 6 = Saturday. open/close in 24h hours.
export const HOURS = [
  { label: 'Mon – Fri', days: [1, 2, 3, 4, 5], open: 7, close: 18 },
  { label: 'Saturday', days: [6], open: 8, close: 17 },
  { label: 'Sunday', days: [0], open: 8, close: 15 },
];

export const LOCATION = {
  street: '123 Placeholder Street',
  city: 'Your City, ST 00000',
  phone: '(555) 010-0199',
  notes: 'Free Wi-Fi · Dog friendly · Bike rack out front',
};

export const STORY = {
  text: "We started Ember & Oak in a one-car garage with a secondhand roaster and a stubborn idea: great coffee shouldn't come with a lecture. Six years later we still roast every Tuesday, still taste every batch before it leaves the door, and still know most of you by name.",
  stats: [
    { value: 6, label: 'Years roasting' },
    { value: 14, label: 'Farms we buy from directly' },
    { value: 2400, label: 'Pounds roasted last year' },
    { value: 1, label: 'Very old roaster named Doris' },
  ],
  steps: [
    { title: 'Source', icon: 'leaf', text: 'We buy green coffee straight from growers we visit, and pay well above fair-trade minimums.' },
    { title: 'Roast', icon: 'flame', text: 'Small 12 kg batches, profiled for each origin, rested a few days before they hit the shelf.' },
    { title: 'Brew', icon: 'cup', text: 'Dialed in every morning, poured by baristas who will happily talk your ear off about it.' },
  ],
};

export const TAX_RATE = 0.0825;
