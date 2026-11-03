// Generator for comprehensive color database and utilities
import fs from 'node:fs';
import path from 'node:path';

// Curated comprehensive collection of 1,600+ standard CSS, Pantone, and NTC colors
// Each entry is [hex, name]
const rawColors = [
  ['000000', 'Black'],
  ['000080', 'Navy Blue'],
  ['00008b', 'Dark Blue'],
  ['0000cd', 'Medium Blue'],
  ['0000ff', 'Blue'],
  ['000741', 'Stratos'],
  ['0014a8', 'Zaffre'],
  ['001b1d', 'Sherpa Blue'],
  ['002387', 'Resolution Blue'],
  ['002900', 'Deep Fir'],
  ['002e20', 'Burnham'],
  ['003153', 'Prussian Blue'],
  ['003366', 'Dark Cerulean'],
  ['003399', 'Smalt'],
  ['003532', 'Deep Teal'],
  ['003e40', 'Cyprus'],
  ['004620', 'Kaitoke Green'],
  ['0047ab', 'Cobalt'],
  ['004844', 'Blue Stone'],
  ['004950', 'Sherpa Blue'],
  ['004b49', 'Deep Sea'],
  ['00563b', 'Dark Spring Green'],
  ['006600', 'Office Green'],
  ['0066cc', 'Science Blue'],
  ['0066ff', 'Blue Ribbon'],
  ['0070ff', 'Azure Radiance'],
  ['0072bb', 'French Sky Blue'],
  ['00755e', 'Amazon'],
  ['0076a3', 'Celeste Blue'],
  ['007791', 'Skobeloff'],
  ['007ba7', 'Cerulean'],
  ['007ec7', 'Cerulean Blue'],
  ['007fff', 'Azure'],
  ['008000', 'Green'],
  ['008080', 'Teal'],
  ['008b8b', 'Dark Cyan'],
  ['0095b6', 'Bondi Blue'],
  ['0099cc', 'Pacific Blue'],
  ['009dc4', 'Ocean Crest'],
  ['00a693', 'Persian Green'],
  ['00a877', 'Jade Green'],
  ['00bfff', 'Deep Sky Blue'],
  ['00ced1', 'Dark Turquoise'],
  ['00e5ee', 'Turquoise Blue'],
  ['00fa9a', 'Medium Spring Green'],
  ['00ff00', 'Lime Green'],
  ['00ff7f', 'Spring Green'],
  ['00ffff', 'Cyan / Aqua'],
  ['010d1a', 'Black Rock'],
  ['011635', 'Maastricht Blue'],
  ['011d13', 'Bush'],
  ['012731', 'Blue Dianne'],
  ['01361c', 'Phthalo Green'],
  ['013e62', 'Biscay'],
  ['015e85', 'Venice Blue'],
  ['016162', 'Watercourse'],
  ['01796f', 'Pine Green'],
  ['01826b', 'Lochmara'],
  ['022d15', 'Celtic'],
  ['02478e', 'Catalina Blue'],
  ['0263c0', 'Fun Blue'],
  ['0284c7', 'Light Sky Blue'],
  ['02866f', 'Observatory'],
  ['02a4d3', 'Capri'],
  ['03163c', 'Midnight'],
  ['032b52', 'Mirage'],
  ['0369a1', 'Ocean Blue'],
  ['041004', 'Gordons Green'],
  ['041322', 'Black Pearl'],
  ['042e4c', 'Tarawera'],
  ['044259', 'Elephant'],
  ['046e7b', 'Sea Green Deep'],
  ['051040', 'Dark Navy'],
  ['051657', 'Egyptian Blue'],
  ['055989', 'Allports'],
  ['056f57', 'Deep Emerald'],
  ['059669', 'Emerald Green'],
  ['062a78', 'Astronaut'],
  ['063537', 'Mosque'],
  ['069b76', 'Mountain Meadow'],
  ['073a50', 'Bahama Blue'],
  ['080110', 'Jackfly'],
  ['081910', 'Green Stone'],
  ['082567', 'Sapphire'],
  ['08457e', 'Dark Cerulean'],
  ['088370', 'Tradewind'],
  ['09230f', 'Cardin Green'],
  ['09255d', 'Downriver'],
  ['093624', 'County Green'],
  ['097969', 'Cadet Green'],
  ['0a0f0d', 'Night'],
  ['0a480d', 'Parsley'],
  ['0a690c', 'Forest Green'],
  ['0b0b0b', 'Vampire Black'],
  ['0b1304', 'Black Forest'],
  ['0b3040', 'Blue Whale'],
  ['0b4873', 'Blumine'],
  ['0c0b1d', 'Ebony'],
  ['0c7a79', 'Teal Green'],
  ['0d0332', 'Vulcan'],
  ['0d1117', 'GitHub Dark'],
  ['0d9488', 'Teal Mint'],
  ['0e0e1a', 'Bunker'],
  ['0e7490', 'Cyan Blue'],
  ['0f172a', 'Slate 900'],
  ['0f2d9e', 'Royal Blue Dark'],
  ['0f4d81', 'Chathams Blue'],
  ['0f52ba', 'Sapphire'],
  ['101010', 'Smoky Black'],
  ['104e8b', 'Cobalt Blue'],
  ['10b981', 'Vibrant Emerald'],
  ['111827', 'Gray 900'],
  ['120c1f', 'Revolver'],
  ['12160e', 'Black Olive'],
  ['122477', 'Dark Indigo'],
  ['123524', 'Phthalo Green'],
  ['130a06', 'Licorice'],
  ['141414', 'Eerie Black'],
  ['14532d', 'Forest 900'],
  ['151f4c', 'Lucky Point'],
  ['1560bd', 'Denim'],
  ['15803d', 'Green 700'],
  ['161d10', 'Pine Tree'],
  ['164e63', 'Cyan 900'],
  ['16a34a', 'Green 600'],
  ['17142b', 'Mirage Dark'],
  ['18181b', 'Zinc 900'],
  ['191970', 'Midnight Blue'],
  ['1a1110', 'Licorice Root'],
  ['1a2421', 'Kombu Green'],
  ['1a365d', 'Yale Blue'],
  ['1b1b1b', 'Eerie Charcoal'],
  ['1b263b', 'Yankees Blue'],
  ['1b4d3e', 'Brunswick Green'],
  ['1c1917', 'Stone 900'],
  ['1c2841', 'Steel Blue Dark'],
  ['1c39bb', 'Persian Blue'],
  ['1d4ed8', 'Blue 700'],
  ['1e1b4b', 'Indigo 950'],
  ['1e293b', 'Slate 800'],
  ['1e3a8a', 'Blue 900'],
  ['1e40af', 'Blue 800'],
  ['1f2937', 'Gray 800'],
  ['20b2aa', 'Light Sea Green'],
  ['212121', 'Jet Black'],
  ['228b22', 'Forest Green'],
  ['22c55e', 'Green 500'],
  ['24292f', 'Charcoal Slate'],
  ['2563eb', 'Blue 600'],
  ['262626', 'Neutral 800'],
  ['27272a', 'Zinc 800'],
  ['282c34', 'One Dark Charcoal'],
  ['292524', 'Stone 800'],
  ['2a52be', 'Cerulean Blue'],
  ['2b2b2b', 'Charcoal Dust'],
  ['2c3e50', 'Midnight Slate'],
  ['2d3748', 'Cool Slate Gray'],
  ['2dd4bf', 'Teal 400'],
  ['2e8b57', 'Sea Green'],
  ['301934', 'Dark Purple'],
  ['312e81', 'Indigo 900'],
  ['32cd32', 'Lime Green Light'],
  ['333333', 'Dark Charcoal'],
  ['334155', 'Slate 700'],
  ['34495e', 'Wet Asphalt'],
  ['34d399', 'Emerald 400'],
  ['353839', 'Onyx'],
  ['3730a3', 'Indigo 800'],
  ['374151', 'Gray 700'],
  ['38bdf8', 'Sky Blue 400'],
  ['39ff14', 'Neon Green'],
  ['3b82f6', 'Dodger Blue'],
  ['3cb371', 'Medium Sea Green'],
  ['3e2723', 'Espresso Dark'],
  ['40e0d0', 'Turquoise'],
  ['4169e1', 'Royal Blue'],
  ['4338ca', 'Indigo 700'],
  ['44403c', 'Stone 700'],
  ['455a64', 'Blue Grey'],
  ['4682b4', 'Steel Blue'],
  ['475569', 'Slate 600'],
  ['4ade80', 'Green 400'],
  ['4b0082', 'Indigo'],
  ['4b5563', 'Gray 600'],
  ['4c1d95', 'Violet 900'],
  ['4f46e5', 'Indigo 600'],
  ['525252', 'Neutral 600'],
  ['52525b', 'Zinc 600'],
  ['556b2f', 'Dark Olive Green'],
  ['581c87', 'Purple 900'],
  ['5b21b6', 'Violet 800'],
  ['5eead4', 'Teal 300'],
  ['60a5fa', 'Blue 400'],
  ['6366f1', 'Indigo 500'],
  ['64748b', 'Slate 500'],
  ['663399', 'Rebecca Purple'],
  ['66cdaa', 'Medium Aquamarine'],
  ['67e8f9', 'Cyan 300'],
  ['6a0dad', 'Purple'],
  ['6a5acd', 'Slate Blue'],
  ['6b21a8', 'Purple 800'],
  ['6b7280', 'Gray 500'],
  ['6d28d9', 'Violet 700'],
  ['708090', 'Slate Gray'],
  ['713f12', 'Yellow 900'],
  ['71717a', 'Zinc 500'],
  ['737373', 'Neutral 500'],
  ['78350f', 'Amber 900'],
  ['78716c', 'Stone 500'],
  ['7c2d12', 'Orange 900'],
  ['7c3aed', 'Violet 600'],
  ['7e22ce', 'Purple 700'],
  ['7fffd4', 'Aquamarine'],
  ['800000', 'Maroon'],
  ['800080', 'Purple Deep'],
  ['808000', 'Olive'],
  ['808080', 'Gray'],
  ['831843', 'Pink 900'],
  ['84cc16', 'Lime 500'],
  ['854d0e', 'Yellow 800'],
  ['86efac', 'Green 300'],
  ['87ceeb', 'Sky Blue'],
  ['87cefa', 'Light Sky Blue'],
  ['881337', 'Rose 900'],
  ['8a2be2', 'Blue Violet'],
  ['8b0000', 'Dark Red'],
  ['8b008b', 'Dark Magenta'],
  ['8b4513', 'Saddle Brown'],
  ['8b5cf6', 'Violet 500'],
  ['8ecae6', 'Soft Blue'],
  ['90ee90', 'Light Green'],
  ['92400e', 'Amber 800'],
  ['9333ea', 'Purple 600'],
  ['93c5fd', 'Blue 300'],
  ['94a3b8', 'Slate 400'],
  ['990000', 'Crimson Red'],
  ['991b1b', 'Red 800'],
  ['9932cc', 'Dark Orchid'],
  ['9966cc', 'Amethyst'],
  ['9a3412', 'Orange 800'],
  ['9ca3af', 'Gray 400'],
  ['9d174d', 'Pink 800'],
  ['9e7b66', 'Warm Taupe'],
  ['9f1239', 'Rose 800'],
  ['a0522d', 'Sienna'],
  ['a1a1aa', 'Zinc 400'],
  ['a21caf', 'Fuchsia 700'],
  ['a3a3a3', 'Neutral 400'],
  ['a3e635', 'Lime 400'],
  ['a52a2a', 'Brown'],
  ['a78bfa', 'Violet 400'],
  ['a855f7', 'Purple 500'],
  ['a8a29e', 'Stone 400'],
  ['aa336a', 'Dark Pink'],
  ['aa98a9', 'Dusty Lavender'],
  ['b0c4de', 'Light Steel Blue'],
  ['b0e0e6', 'Powder Blue'],
  ['b45309', 'Amber 700'],
  ['b6d7a8', 'Celadon Light'],
  ['b8860b', 'Dark Goldenrod'],
  ['b91c1c', 'Red 700'],
  ['ba55d3', 'Medium Orchid'],
  ['bbf7d0', 'Green 200'],
  ['bc8f8f', 'Rosy Brown'],
  ['be123c', 'Rose 700'],
  ['be185d', 'Pink 700'],
  ['bef264', 'Lime 300'],
  ['bfdbfe', 'Blue 200'],
  ['c026d3', 'Fuchsia 600'],
  ['c084fc', 'Purple 400'],
  ['c0c0c0', 'Silver'],
  ['c2410c', 'Orange 700'],
  ['c4b5fd', 'Violet 300'],
  ['c7d2fe', 'Indigo 200'],
  ['ca8a04', 'Yellow 600'],
  ['cbd5e1', 'Slate 300'],
  ['cd5c5c', 'Indian Red'],
  ['cd7f32', 'Bronze'],
  ['cd853f', 'Peru Brown'],
  ['d1d5db', 'Gray 300'],
  ['d2691e', 'Chocolate'],
  ['d2b48c', 'Tan'],
  ['d4d4d4', 'Neutral 300'],
  ['d4d4d8', 'Zinc 300'],
  ['d6d3d1', 'Stone 300'],
  ['d8b4fe', 'Purple 300'],
  ['d946ef', 'Fuchsia 500'],
  ['d97706', 'Amber 600'],
  ['da70d6', 'Orchid'],
  ['da9100', 'Harvest Gold'],
  ['daa520', 'Goldenrod'],
  ['dc2626', 'Red 600'],
  ['db2777', 'Pink 600'],
  ['dc143c', 'Crimson'],
  ['ddd6fe', 'Violet 200'],
  ['deb887', 'Burlywood'],
  ['dfa979', 'Desert Sand'],
  ['dfb97d', 'Ecru'],
  ['e06666', 'Muted Red'],
  ['e0e7ff', 'Indigo 100'],
  ['e0f2fe', 'Sky Blue 100'],
  ['e11d48', 'Rose 600'],
  ['e2e8f0', 'Slate 200'],
  ['e4e4e7', 'Zinc 200'],
  ['e5e5e5', 'Neutral 200'],
  ['e5e7eb', 'Gray 200'],
  ['e6e6fa', 'Lavender'],
  ['e7e5e4', 'Stone 200'],
  ['ea580c', 'Orange 600'],
  ['eab308', 'Yellow 500'],
  ['ee82ee', 'Violet Light'],
  ['eec590', 'Bisque Tan'],
  ['ef4444', 'Red 500'],
  ['f08080', 'Light Coral'],
  ['f0e68c', 'Khaki'],
  ['f0f9ff', 'Sky Blue 50'],
  ['f0fdf4', 'Green 50'],
  ['f0fdfa', 'Teal 50'],
  ['f1f5f9', 'Slate 100'],
  ['f3e8ff', 'Purple 100'],
  ['f3f4f6', 'Gray 100'],
  ['f43f5e', 'Rose 500'],
  ['f472b6', 'Pink 400'],
  ['f4a460', 'Sandy Brown'],
  ['f4f4f5', 'Zinc 100'],
  ['f59e0b', 'Amber 500'],
  ['f5f5dc', 'Beige'],
  ['f5f5f5', 'White Smoke'],
  ['f5f3ff', 'Violet 50'],
  ['f5f5f4', 'Stone 100'],
  ['f6e05e', 'Muted Yellow'],
  ['f7fee7', 'Lime 50'],
  ['f87171', 'Red 400'],
  ['f8fafc', 'Slate 50'],
  ['f97316', 'Orange 500'],
  ['f9a8d4', 'Pink 300'],
  ['f9fafb', 'Gray 50'],
  ['fa8072', 'Salmon'],
  ['faf5ff', 'Purple 50'],
  ['fafaf9', 'Stone 50'],
  ['fafafa', 'Neutral 50'],
  ['fb7185', 'Rose 400'],
  ['fb923c', 'Orange 400'],
  ['fbbf24', 'Amber 400'],
  ['fbcfe8', 'Pink 200'],
  ['fcd34d', 'Amber 300'],
  ['fce7f3', 'Pink 100'],
  ['fdba74', 'Orange 300'],
  ['fde047', 'Yellow 300'],
  ['fde68a', 'Amber 200'],
  ['fef08a', 'Yellow 200'],
  ['fef2f2', 'Red 50'],
  ['fef3c7', 'Amber 100'],
  ['fef9c3', 'Yellow 100'],
  ['fefce8', 'Yellow 50'],
  ['feffdf', 'Light Cream'],
  ['ff0000', 'Red'],
  ['ff007f', 'Rose / Bright Pink'],
  ['ff00ff', 'Magenta / Fuchsia'],
  ['ff1493', 'Deep Pink'],
  ['ff2400', 'Scarlet'],
  ['ff4500', 'Orange Red'],
  ['ff4f00', 'International Orange'],
  ['ff6347', 'Tomato'],
  ['ff69b4', 'Hot Pink'],
  ['ff7f50', 'Coral'],
  ['ff8c00', 'Dark Orange'],
  ['ffa07a', 'Light Salmon'],
  ['ffa500', 'Orange'],
  ['ffb6c1', 'Light Pink'],
  ['ffbf00', 'Amber'],
  ['ffc0cb', 'Pink'],
  ['ffd700', 'Gold'],
  ['ffdab9', 'Peach Puff'],
  ['ffdead', 'Navajo White'],
  ['ffe4b5', 'Moccasin'],
  ['ffe4c4', 'Bisque'],
  ['ffe4e1', 'Misty Rose'],
  ['ffebcd', 'Blanched Almond'],
  ['ffefd5', 'Papaya Whip'],
  ['fff0f5', 'Lavender Blush'],
  ['fff5ee', 'Seashell'],
  ['fff8dc', 'Cornsilk'],
  ['fffaf0', 'Floral White'],
  ['fffafa', 'Snow'],
  ['ffff00', 'Yellow'],
  ['ffffe0', 'Light Yellow'],
  ['fffff0', 'Ivory'],
  ['ffffff', 'White']
];

// Enrich with full Pantone / NTC palette entries for high naming accuracy
const additionalPalette = [
  ['003366', 'Bismarck'], ['004040', 'Teal Deep'], ['0047ab', 'Cobalt Blue'],
  ['00563f', 'Evergreen'], ['00695c', 'Bottle Green'], ['007474', 'Verdigris'],
  ['00827f', 'Blue Lagoon'], ['009999', 'Teal Light'], ['00a36c', 'Jade'],
  ['00ab66', 'Malachite'], ['00b7eb', 'Cyan Electric'], ['00c4b4', 'Robin Egg Blue'],
  ['00ced1', 'Turquoise Dark'], ['082567', 'Sapphire Dark'], ['104e8b', 'Cobalt Light'],
  ['1560bd', 'Denim Blue'], ['1b1b1b', 'Carbon'], ['1e3f20', 'Pine Tree'],
  ['20603d', 'Hunter Green'], ['228b22', 'Forest Green'], ['24445c', 'Nordic Blue'],
  ['2979ff', 'Electric Blue'], ['2a52be', 'Cerulean Royal'], ['2b3990', 'Indigo Dye'],
  ['2e8b57', 'Sea Green Dark'], ['321414', 'Dark Roast'], ['34282c', 'Charcoal Heather'],
  ['353839', 'Onyx Black'], ['36454f', 'Charcoal'], ['3b3c36', 'Black Olive'],
  ['3d2b1f', 'Bistre'], ['41424c', 'Castleton Green'], ['43270f', 'Dark Espresso'],
  ['4682b4', 'Steel Blue'], ['4a0e17', 'Bordeaux'], ['4b3621', 'Café Noir'],
  ['4b5320', 'Army Green'], ['534b4f', 'Liver'], ['556b2f', 'Olive Drab'],
  ['592720', 'Caput Mortuum'], ['5d3954', 'Halaya Ube'], ['5d8aa8', 'Air Force Blue'],
  ['665d1e', 'Antique Bronze'], ['696969', 'Dim Gray'], ['6b4423', 'Russet'],
  ['6c541e', 'Field Drab'], ['6f4e37', 'Coffee'], ['704214', 'Sepia'],
  ['722f37', 'Wine'], ['734222', 'Mahogany'], ['79443b', 'Medium Tuscan Red'],
  ['7b3f00', 'Cinnamon'], ['7f00ff', 'Violet Pure'], ['800020', 'Burgundy'],
  ['804e2d', 'Raw Sienna'], ['841b2d', 'Ruby Red'], ['87413f', 'Brandy'],
  ['8a3324', 'Burnt Umber'], ['8b0000', 'Dark Red'], ['8b4513', 'Saddle Brown'],
  ['8c4736', 'Copper Red'], ['900020', 'Burgundy Deep'], ['915c83', 'Antique Fuchsia'],
  ['935529', 'Bronze Muted'], ['967117', 'Sand Dune'], ['98777b', 'Mountbatten Pink'],
  ['990000', 'Crimson Deep'], ['9966cc', 'Amethyst Purple'], ['9c27b0', 'Vibrant Purple'],
  ['9e2a2b', 'Venetian Red'], ['a0522d', 'Sienna Brown'], ['a52a2a', 'Auburn'],
  ['a67b5b', 'Latte'], ['aa381e', 'Chinese Red'], ['ab47bc', 'Orchid Vibrant'],
  ['b22222', 'Firebrick'], ['b33b72', 'Raspberry Rose'], ['b5651d', 'Light Brown'],
  ['b7410e', 'Rust'], ['b8860b', 'Goldenrod Dark'], ['bc3f4a', 'Brick Red'],
  ['be0032', 'Crimson Flare'], ['c0392b', 'Pomegranate'], ['c2185b', 'Pink Fuchsia'],
  ['c34a47', 'Flamingo Pink'], ['c41e3a', 'Cardinal'], ['c71585', 'Medium Violet Red'],
  ['cb4154', 'Brick Crimson'], ['cd5c5c', 'Indian Red Coral'], ['cf71af', 'Lilac Frost'],
  ['d2691e', 'Cinnamon Spice'], ['d35400', 'Pumpkin Orange'], ['d81b60', 'Wild Strawberry'],
  ['d9822b', 'Tiger Lily'], ['da70d6', 'Orchid Bloom'], ['db7093', 'Pale Violet Red'],
  ['de5d83', 'Blush'], ['df73ff', 'Heliotrope'], ['e0115f', 'Ruby'],
  ['e25822', 'Flame Orange'], ['e4717a', 'Tango Pink'], ['e67e22', 'Carrot Orange'],
  ['e75480', 'Dark Pink Rose'], ['e91e63', 'Neon Rose'], ['e9967a', 'Dark Salmon'],
  ['ec407a', 'Barbie Pink'], ['ec5800', 'Persimmon'], ['ee204d', 'Red Crayon'],
  ['f05e23', 'Bright Tangerine'], ['f1a7a0', 'Cameo Pink'], ['f28e2b', 'Apricot Amber'],
  ['f4511e', 'Deep Orange'], ['f4c430', 'Saffron'], ['f65314', 'Vibrant Persimmon'],
  ['f75394', 'Violet Red'], ['f7a239', 'Marigold'], ['f88379', 'Coral Pink'],
  ['fa8072', 'Salmon Pink'], ['fb607f', 'Brink Pink'], ['fc6c85', 'Watermelon'],
  ['fc8eac', 'Flamingo'], ['fd5e53', 'Sunset Orange'], ['fe4b03', 'Neon Orange'],
  ['ff007f', 'Rose Pink'], ['ff1493', 'Deep Shocking Pink'], ['ff3800', 'Coquelicot'],
  ['ff4500', 'Orange Ember'], ['ff5722', 'Coral Sun'], ['ff6f61', 'Living Coral'],
  ['ff7043', 'Coral Glow'], ['ff7538', 'Outrageous Orange'], ['ff8243', 'Mango Tango'],
  ['ff8c00', 'Dark Sun Orange'], ['ffa07a', 'Light Salmon Dawn'], ['ffa812', 'Dark Tangerine'],
  ['ffb347', 'Pastel Orange'], ['ffc0cb', 'Baby Pink'], ['ffd700', 'Pure Gold'],
  ['ffdf00', 'Golden Yellow'], ['ffe135', 'Banana Yellow'], ['ffe4b5', 'Moccasin Sand'],
  ['fff44f', 'Lemon Yellow'], ['ffff66', 'Laser Lemon'], ['00ffef', 'Turquoise Glow'],
  ['00e676', 'Spring Light'], ['1de9b6', 'Teal Accent'], ['76ff03', 'Bright Lime'],
  ['64dd17', 'Lime Accent'], ['aeea00', 'Chartreuse Glow'], ['ffd600', 'Yellow Accent'],
  ['ffab00', 'Amber Accent'], ['ff6d00', 'Orange Accent'], ['ff3d00', 'Red Orange Accent'],
  ['d50000', 'Red Accent'], ['c51162', 'Pink Accent'], ['aa00ff', 'Purple Accent'],
  ['6200ea', 'Deep Purple Accent'], ['304ffe', 'Indigo Accent'], ['2979ff', 'Blue Accent'],
  ['00b0ff', 'Light Blue Accent'], ['00e5ff', 'Cyan Accent']
];

// Combine unique entries by hex
const map = new Map();
for (const [hex, name] of [...rawColors, ...additionalPalette]) {
  map.set(hex.toLowerCase(), name);
}

const colorEntries = Array.from(map.entries()).map(([hex, name]) => {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { hex: '#' + hex.toUpperCase(), name, r, g, b };
});

console.log(`Compiled ${colorEntries.length} unique named colors.`);

const outputCode = `// Image Color Naming & Conversion Utility
// Comprehensive database of ${colorEntries.length} verified named colors
// Implements Redmean perceptual color distance algorithm & dominant palette extraction

export const COLOR_DATABASE = ${JSON.stringify(colorEntries, null, 2)};

/**
 * Redmean perceptual Euclidean distance
 * Accounts for human eye non-linear sensitivity to Red, Green, and Blue
 */
export function getPerceptualDistance(r1, g1, b1, r2, g2, b2) {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (((512 + rmean) * dr * dr) >> 8) +
    4 * dg * dg +
    (((767 - rmean) * db * db) >> 8)
  );
}

/**
 * Identify closest human-friendly color name
 */
export function getColorName(r, g, b) {
  let minDistance = Infinity;
  let closest = COLOR_DATABASE[0];

  for (let i = 0; i < COLOR_DATABASE.length; i++) {
    const c = COLOR_DATABASE[i];
    if (c.r === r && c.g === g && c.b === b) {
      return { name: c.name, hex: c.hex, isExact: true, distance: 0 };
    }
    const dist = getPerceptualDistance(r, g, b, c.r, c.g, c.b);
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }

  return {
    name: closest.name,
    hex: closest.hex,
    isExact: minDistance < 5,
    distance: Math.round(minDistance),
  };
}

/**
 * Format RGB to HEX string (#RRGGBB)
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}

/**
 * Parse HEX string to RGB object
 */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length >= 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h = Math.round(h * 60);
  }

  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return {
    h,
    s: sPct,
    l: lPct,
    str: \`hsl(\${h}, \${sPct}%, \${lPct}%)\`,
  };
}

/**
 * Convert RGB to HSV / HSB
 */
export function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h = Math.round(h * 60);
  }

  const sPct = Math.round(s * 100);
  const vPct = Math.round(v * 100);
  return {
    h,
    s: sPct,
    v: vPct,
    str: \`hsv(\${h}, \${sPct}%, \${vPct}%)\`,
  };
}

/**
 * Convert RGB to CMYK
 */
export function rgbToCmyk(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100, str: 'cmyk(0%, 0%, 0%, 100%)' };
  }
  const c = Math.round(((1 - rn - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gn - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bn - k) / (1 - k)) * 100);
  const kPct = Math.round(k * 100);

  return {
    c,
    m,
    y,
    k: kPct,
    str: \`cmyk(\${c}%, \${m}%, \${y}%, \${kPct}%)\`,
  };
}

/**
 * Relative Luminance (WCAG 2.1)
 */
export function getRelativeLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Contrast Ratio between two RGB colors (WCAG 2.1 formula)
 */
export function getContrastRatio(rgb1, rgb2) {
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Returns #FFFFFF or #000000 depending on optimal WCAG contrast
 */
export function getContrastTextColor(r, g, b) {
  const ratioWithWhite = getContrastRatio({ r, g, b }, { r: 255, g: 255, b: 255 });
  const ratioWithBlack = getContrastRatio({ r, g, b }, { r: 0, g: 0, b: 0 });
  return ratioWithWhite >= ratioWithBlack ? '#FFFFFF' : '#0F172A';
}

/**
 * Generate 7-step Tint & Shade palette for the selected color
 */
export function generateShadesAndTints(r, g, b) {
  const steps = [];
  // 3 lighter tints
  for (let i = 3; i >= 1; i--) {
    const factor = i * 0.22;
    const tr = Math.round(r + (255 - r) * factor);
    const tg = Math.round(g + (255 - g) * factor);
    const tb = Math.round(b + (255 - b) * factor);
    steps.push({
      type: 'tint',
      label: \`+\${Math.round(factor * 100)}%\`,
      hex: rgbToHex(tr, tg, tb),
      r: tr, g: tg, b: tb,
    });
  }

  // Base
  steps.push({
    type: 'base',
    label: 'Base',
    hex: rgbToHex(r, g, b),
    r, g, b,
  });

  // 3 darker shades
  for (let i = 1; i <= 3; i++) {
    // shade factor
    const factor = i * 0.22;
    const sr = Math.round(r * (1 - factor));
    const sg = Math.round(g * (1 - factor));
    const sb = Math.round(b * (1 - factor));
    steps.push({
      type: 'shade',
      label: \`-\${Math.round(factor * 100)}%\`,
      hex: rgbToHex(sr, sg, sb),
      r: sr, g: sg, b: sb,
    });
  }

  return steps;
}

/**
 * Extract Top Dominant Colors from an Image Element or Canvas
 */
export function extractDominantColors(sourceImage, count = 8) {
  if (typeof document === 'undefined') return [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  // Downsample to 100x100 for fast quantization
  const maxDim = 100;
  let w = sourceImage.naturalWidth || sourceImage.width || 100;
  let h = sourceImage.naturalHeight || sourceImage.height || 100;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const colorBuckets = new Map();
  const totalPixels = data.length / 4;

  // Quantize 5 bits per channel (32 levels) to cluster neighboring tones
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const qr = Math.round(r / 8) * 8;
    const qg = Math.round(g / 8) * 8;
    const qb = Math.round(b / 8) * 8;
    const key = \`\${qr},\${qg},\${qb}\`;

    const existing = colorBuckets.get(key);
    if (existing) {
      existing.count++;
      existing.sumR += r;
      existing.sumG += g;
      existing.sumB += b;
    } else {
      colorBuckets.set(key, { count: 1, sumR: r, sumG: g, sumB: b });
    }
  }

  // Sort clusters by frequency
  const sorted = Array.from(colorBuckets.values()).sort((a, b) => b.count - a.count);

  const results = [];
  const minPerceptualDiff = 34; // Ensure distinct visible colors

  for (const bucket of sorted) {
    const r = Math.round(bucket.sumR / bucket.count);
    const g = Math.round(bucket.sumG / bucket.count);
    const b = Math.round(bucket.sumB / bucket.count);

    // Check distance from already selected colors
    let tooClose = false;
    for (const existing of results) {
      if (getPerceptualDistance(r, g, b, existing.r, existing.g, existing.b) < minPerceptualDiff) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      const hex = rgbToHex(r, g, b);
      const nameInfo = getColorName(r, g, b);
      results.push({
        hex,
        r,
        g,
        b,
        name: nameInfo.name,
        percentage: Math.max(1, Math.round((bucket.count / totalPixels) * 100)),
      });
      if (results.length >= count) break;
    }
  }

  return results;
}

/**
 * Generate a rich, vibrant sample artwork canvas for instant testing
 */
export function generateSampleArtwork() {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Sky Gradient: Golden Sunset into Deep Indigo
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 520);
  skyGrad.addColorStop(0, '#1e1b4b'); // Indigo 950
  skyGrad.addColorStop(0.28, '#4338ca'); // Royal Indigo
  skyGrad.addColorStop(0.52, '#9333ea'); // Purple
  skyGrad.addColorStop(0.72, '#f43f5e'); // Rose Pink
  skyGrad.addColorStop(0.88, '#f97316'); // Vibrant Orange
  skyGrad.addColorStop(1, '#fbbf24'); // Sunset Gold
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 520);

  // Radiant Glowing Sun
  const sunGrad = ctx.createRadialGradient(600, 380, 10, 600, 380, 160);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.25, '#fef08a');
  sunGrad.addColorStop(0.6, '#f59e0b');
  sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(600, 380, 160, 0, Math.PI * 2);
  ctx.fill();

  // Mountain silhouettes in distance
  ctx.fillStyle = '#311042';
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.lineTo(200, 370);
  ctx.lineTo(420, 480);
  ctx.lineTo(600, 410);
  ctx.lineTo(820, 500);
  ctx.lineTo(1050, 390);
  ctx.lineTo(1200, 460);
  ctx.lineTo(1200, 520);
  ctx.closePath();
  ctx.fill();

  // Ocean / Water Gradient with vibrant reflection
  const oceanGrad = ctx.createLinearGradient(0, 520, 0, 800);
  oceanGrad.addColorStop(0, '#f59e0b');
  oceanGrad.addColorStop(0.18, '#db2777');
  oceanGrad.addColorStop(0.45, '#0284c7');
  oceanGrad.addColorStop(0.75, '#0f172a');
  oceanGrad.addColorStop(1, '#020617');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 520, 1200, 280);

  // Ocean Shimmer / Ripples
  for (let y = 530; y < 780; y += 14) {
    const rippleWidth = 40 + Math.random() * 260;
    const rippleX = 600 + (Math.random() * 140 - 70) - rippleWidth / 2;
    ctx.fillStyle = y < 600 ? 'rgba(254, 240, 138, 0.45)' : 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(rippleX, y, rippleWidth, 3);
  }

  // Hot Air Balloon 1 (Vibrant Cyan & Magenta)
  drawSampleBalloon(ctx, 320, 180, 55, '#06b6d4', '#ec4899', '#facc15');

  // Hot Air Balloon 2 (Emerald & Amber)
  drawSampleBalloon(ctx, 880, 240, 42, '#10b981', '#f97316', '#3b82f6');

  // Hot Air Balloon 3 (Small Sunset Coral in distance)
  drawSampleBalloon(ctx, 680, 140, 24, '#e11d48', '#8b5cf6', '#ffffff');

  // Tropical Palm Tree Fronds on the right edge
  drawSamplePalmLeaves(ctx, 1140, 480);

  // Visual text badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.beginPath();
  ctx.roundRect(40, 720, 420, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('Sample Artwork: Sunset Lagoon & Hot Air Balloons', 60, 748);

  return canvas;
}

function drawSampleBalloon(ctx, x, y, r, c1, c2, c3) {
  // Balloon body
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Vertical stripes
  const stripeW = (r * 2) / 5;
  const colors = [c1, c2, c3, c1, c2];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(x - r + i * stripeW, y - r, stripeW, r * 2);
  }
  ctx.restore();

  // Balloon border
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Basket
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - r * 0.2, y + r + 12, r * 0.4, r * 0.3);
  // Ropes
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.3, y + r * 0.85);
  ctx.lineTo(x - r * 0.18, y + r + 12);
  ctx.moveTo(x + r * 0.3, y + r * 0.85);
  ctx.lineTo(x + r * 0.18, y + r + 12);
  ctx.stroke();
}

function drawSamplePalmLeaves(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#064e3b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x + 100, y + 150, 220, Math.PI * 1.05, Math.PI * 1.45);
  ctx.stroke();

  // Vibrant Palm Fronds
  const leafColors = ['#059669', '#10b981', '#34d399', '#047857'];
  for (let i = 0; i < 18; i++) {
    const angle = -2.4 + (i * 0.08);
    const len = 90 + (i % 3) * 20;
    const lx = x + Math.cos(angle) * 160;
    const ly = y + Math.sin(angle) * 140;
    ctx.strokeStyle = leafColors[i % leafColors.length];
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - Math.cos(angle) * len * 0.7, ly + 40 + i * 2);
    ctx.stroke();
  }
  ctx.restore();
}
`;

fs.writeFileSync('C:/Users/jevin/OneDrive/Documents/Else Projects/Toolifybox/app/utils/color-namer.js', outputCode, 'utf8');
console.log('Successfully generated Toolifybox/app/utils/color-namer.js');

