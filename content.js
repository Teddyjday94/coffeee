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
  { name: 'Ember Blend', origin: 'House espresso', process: 'Brazil · Colombia · Ethiopia', notes: 'Dark chocolate, cherry, molasses', hue: 12, price: 18, type: 'blend', paper: 'black', roast: 4, altitude: '1,100–2,000 m', featured: 1,
    blurb: 'The backbone of every espresso drink we pour. Built to taste great straight or under a cloud of milk.' },
  { name: 'Morning Oak', origin: 'Breakfast blend', process: 'Brazil · Guatemala', notes: 'Milk chocolate, hazelnut, honey', hue: 28, price: 17, type: 'blend', paper: 'kraft', roast: 3, altitude: '1,000–1,600 m', featured: 4,
    blurb: 'Easygoing and sweet. The pot of coffee you want on a slow Saturday.' },
  { name: 'Yirgacheffe', origin: 'Ethiopia', process: 'Washed · Heirloom', notes: 'Jasmine, bergamot, lemon curd', hue: 42, price: 21, type: 'single', paper: 'white', roast: 1, altitude: '1,900–2,200 m', featured: 2,
    blurb: 'Floral and tea-like, with a bright lemon finish. Stunning as a pour over.' },
  { name: 'Sidama', origin: 'Ethiopia', process: 'Natural · Heirloom', notes: 'Blueberry, cacao nib, rose', hue: 330, price: 22, type: 'single', paper: 'kraft', roast: 2, altitude: '1,800–2,100 m',
    blurb: 'Dried on raised beds in the whole cherry, which gives it that jammy blueberry punch.' },
  { name: 'Huila', origin: 'Colombia', process: 'Washed · Caturra', notes: 'Caramel, red apple, cocoa', hue: 150, price: 19, type: 'single', paper: 'kraft', roast: 2, altitude: '1,600–1,900 m',
    blurb: 'Balanced and juicy. A crowd-pleaser that works in every brewer you own.' },
  { name: 'Nyeri AA', origin: 'Kenya', process: 'Washed · SL28', notes: 'Blackcurrant, grapefruit, cane sugar', hue: 350, price: 23, type: 'single', paper: 'white', roast: 2, altitude: '1,700–1,900 m',
    blurb: 'Bold, savory-sweet and unmistakably Kenyan. Big blackcurrant from first sip to last.' },
  { name: 'Antigua', origin: 'Guatemala', process: 'Washed · Bourbon', notes: 'Toffee, orange zest, almond', hue: 200, price: 19, type: 'single', paper: 'kraft', roast: 3, altitude: '1,500–1,700 m',
    blurb: 'Grown between three volcanoes. Toffee sweetness with a little citrus lift.' },
  { name: 'Tarrazú', origin: 'Costa Rica', process: 'Honey · Catuaí', notes: 'Brown sugar, apricot, vanilla', hue: 52, price: 20, type: 'single', paper: 'white', roast: 2, altitude: '1,400–1,800 m',
    blurb: 'Honey processed, so some fruit is left on while it dries. Silky, sweet and round.' },
  { name: 'Cerrado', origin: 'Brazil', process: 'Natural · Mundo Novo', notes: 'Peanut brittle, cocoa, raisin', hue: 95, price: 17, type: 'single', paper: 'black', roast: 3, altitude: '900–1,200 m',
    blurb: 'Nutty, chocolatey and low in acidity. Fantastic as cold brew.' },
  { name: 'Mandheling', origin: 'Sumatra', process: 'Wet-hulled · Typica', notes: 'Cedar, dark cocoa, clove', hue: 270, price: 20, type: 'single', paper: 'black', roast: 4, altitude: '1,100–1,500 m',
    blurb: 'Earthy, heavy-bodied and spiced. For people who like their coffee to fight back a little.' },
  { name: 'Gesha Reserve', origin: 'Panama', process: 'Washed · Gesha', notes: 'Peach, jasmine, honeycomb', hue: 175, price: 38, type: 'single', paper: 'white', roast: 1, badge: 'Reserve', altitude: '1,700–1,900 m', featured: 3,
    blurb: 'A tiny lot of the most celebrated variety in coffee. Delicate, perfumed, unforgettable.' },
  { name: 'Night Owl', origin: 'Swiss water decaf', process: 'Colombia · Decaf', notes: 'Brown sugar, cocoa, plum', hue: 225, price: 19, type: 'decaf', paper: 'black', roast: 3, altitude: '1,500–1,800 m',
    blurb: 'Decaffeinated with only water, so all the flavor stays. Nobody will know.' },
];

export const GRINDS = ['Whole bean', 'Espresso', 'Pour over', 'French press', 'Drip'];
export const BAG_SIZES = [
  { label: '12 oz', mult: 1 },
  { label: '2 lb', mult: 2.4 },
];
export const SUBSCRIPTION = { discount: 0.1, frequencies: ['Every 2 weeks', 'Every 4 weeks'] };

export const BREW_GUIDE = [
  { method: 'Pour over', ratio: '1 : 16', time: '3:00', grind: 2, temp: '96°C', tip: 'Bloom with twice the coffee weight in water for 40 seconds, then pour slowly in circles.' },
  { method: 'French press', ratio: '1 : 15', time: '4:00', grind: 4, temp: '94°C', tip: 'Break the crust at 4 minutes, skim the foam, then press gently and pour it all out.' },
  { method: 'Espresso', ratio: '1 : 2', time: '0:28', grind: 0, temp: '93°C', tip: '18 g in, 36 g out. Too sour? Grind finer. Too bitter? Grind coarser.' },
  { method: 'Cold brew', ratio: '1 : 8', time: '18 hrs', grind: 5, temp: 'Room temp', tip: 'Steep in the fridge overnight, strain twice, and dilute 1:1 with water or milk.' },
];

// The full menu. Signature iced drinks come from DRINKS above.
// tags: V = vegan, GF = gluten free
export const MENU = [
  {
    id: 'espresso', title: 'Espresso bar', note: 'Every drink starts with a double shot of the Ember Blend.',
    items: [
      { name: 'Espresso', price: 3.25, desc: 'Double shot, rich and syrupy' },
      { name: 'Americano', price: 3.75, desc: 'Espresso stretched with hot water' },
      { name: 'Cortado', price: 4.0, desc: 'Equal parts espresso and silky milk' },
      { name: 'Flat white', price: 4.5, desc: 'Ristretto shots, velvet microfoam' },
      { name: 'Cappuccino', price: 4.75, desc: 'Airy foam, cocoa dusting on request' },
      { name: 'Latte', price: 5.0, desc: 'Smooth, milky, endlessly customizable' },
      { name: 'Drip coffee', price: 3.0, desc: 'Rotating single origin, free refills in-house' },
    ],
  },
  {
    id: 'tea', title: 'Tea & more', note: 'Not a coffee person? We still like you.',
    items: [
      { name: 'Chai latte', price: 4.75, desc: 'House-spiced black tea, not too sweet' },
      { name: 'Matcha latte', price: 5.25, desc: 'Ceremonial grade, whisked to order' },
      { name: 'London fog', price: 4.75, desc: 'Earl grey, vanilla, steamed milk' },
      { name: 'Hot chocolate', price: 4.25, desc: 'Dark chocolate ganache, steamed milk', tags: ['GF'] },
      { name: 'Loose-leaf tea', price: 3.5, desc: 'Ask about the rotating selection', tags: ['V', 'GF'] },
    ],
  },
  {
    id: 'bakery', title: 'From the case', note: 'Baked in-house every morning. Usually gone by 2pm.',
    items: [
      { name: 'Butter croissant', price: 3.75, desc: 'Three days of lamination, worth it' },
      { name: 'Pain au chocolat', price: 4.25, desc: 'Two batons of dark chocolate' },
      { name: 'Blueberry muffin', price: 3.5, desc: 'Crumb top, bursting berries' },
      { name: 'Brown butter cookie', price: 2.75, desc: 'Sea salt, dark chocolate chunks' },
      { name: 'Banana bread', price: 3.75, desc: 'Walnuts, cinnamon, a little brown sugar crust', tags: ['V'] },
      { name: 'Avocado toast', price: 9.0, desc: 'Sourdough, chili crisp, lemon, herbs', tags: ['V'] },
      { name: 'Breakfast sandwich', price: 8.5, desc: 'Egg, cheddar, bacon or tomato jam, brioche bun' },
    ],
  },
];
export const EXTRAS = 'Oat, almond or whole milk at no charge · Extra shot +$1.00 · House syrups +$0.50 · Decaf any drink';

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

export const AMENITIES = [
  { icon: 'wifi', title: 'Fast Wi-Fi', text: 'No time limits on weekdays. Laptops off the big table on weekends.' },
  { icon: 'dog', title: 'Dog friendly', text: 'Water bowls out front and a jar of treats behind the bar.' },
  { icon: 'plug', title: 'Plenty of outlets', text: 'Under every bench seat and along the window bar.' },
  { icon: 'bike', title: 'Bike rack', text: 'Room for eight bikes, plus a pump if you need air.' },
  { icon: 'access', title: 'Accessible', text: 'Step-free entrance, wide aisles and an accessible restroom.' },
  { icon: 'sun', title: 'Patio seating', text: 'Six tables out back, heated in the colder months.' },
];

export const GETTING_HERE = [
  { title: 'On foot or bike', text: "Two blocks north of the park, on the corner of Main St & Oak Ave. Look for the black awning." },
  { title: 'Transit', text: 'The 12 and 34 buses stop right outside. The Main St station is a 6-minute walk.' },
  { title: 'Parking', text: 'Free street parking after 6pm and all weekend. There is a public garage on Oak Ave.' },
];

export const FAQ = [
  { q: 'Can I order ahead?', a: 'Yes. Add drinks or beans to your bag on the Menu or Shop page and pick a pickup time at checkout. Your order will be waiting on the pickup shelf by the door.' },
  { q: 'Do you take reservations?', a: "We don't take reservations for tables, but the back room can be booked for groups of 8–20. Send us a message below." },
  { q: 'Do you cater or do events?', a: 'We do! Coffee service, espresso carts and pastry spreads for offices, weddings and pop-ups. Use the form below and choose "Catering & events".' },
  { q: 'Do you sell wholesale?', a: 'We supply a handful of local cafés and restaurants with beans and training. Reach out with the "Wholesale" topic and we will set up a tasting.' },
  { q: 'Are there non-dairy options?', a: 'Oat and almond milk are always free. Our banana bread and avocado toast are vegan, and the hot chocolate is gluten free.' },
];

// "A day at Ember & Oak" timeline on the home page. at = hour of the day (24h).
export const DAY = [
  { at: 6, time: '6:00am', title: 'Ovens on', text: 'Croissants go in and the whole block starts to smell like butter.' },
  { at: 7, time: '7:00am', title: 'Doors open', text: 'First shots pulled. The regulars are usually already waiting.' },
  { at: 9.5, time: '9:30am', title: 'Rush hour', text: 'The pickup shelf works overtime. Order ahead and skip the line.' },
  { at: 12, time: '12:00pm', title: "Iced o'clock", text: 'Cold brew and signature drinks take over the bar.' },
  { at: 14, time: '2:00pm', title: 'Case empties', text: 'Last croissant goes around now. We did warn you.' },
  { at: 18, time: '6:00pm', title: 'Last call', text: 'Final pour, lights down, see you tomorrow.' },
];

export const TAX_RATE = 0.0825;
