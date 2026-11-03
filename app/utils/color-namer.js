// Image Color Naming & Conversion Utility
// Comprehensive database of 517 verified named colors
// Implements Redmean perceptual color distance algorithm & dominant palette extraction

export const COLOR_DATABASE = [
  {
    "hex": "#000000",
    "name": "Black",
    "r": 0,
    "g": 0,
    "b": 0
  },
  {
    "hex": "#000080",
    "name": "Navy Blue",
    "r": 0,
    "g": 0,
    "b": 128
  },
  {
    "hex": "#00008B",
    "name": "Dark Blue",
    "r": 0,
    "g": 0,
    "b": 139
  },
  {
    "hex": "#0000CD",
    "name": "Medium Blue",
    "r": 0,
    "g": 0,
    "b": 205
  },
  {
    "hex": "#0000FF",
    "name": "Blue",
    "r": 0,
    "g": 0,
    "b": 255
  },
  {
    "hex": "#000741",
    "name": "Stratos",
    "r": 0,
    "g": 7,
    "b": 65
  },
  {
    "hex": "#0014A8",
    "name": "Zaffre",
    "r": 0,
    "g": 20,
    "b": 168
  },
  {
    "hex": "#001B1D",
    "name": "Sherpa Blue",
    "r": 0,
    "g": 27,
    "b": 29
  },
  {
    "hex": "#002387",
    "name": "Resolution Blue",
    "r": 0,
    "g": 35,
    "b": 135
  },
  {
    "hex": "#002900",
    "name": "Deep Fir",
    "r": 0,
    "g": 41,
    "b": 0
  },
  {
    "hex": "#002E20",
    "name": "Burnham",
    "r": 0,
    "g": 46,
    "b": 32
  },
  {
    "hex": "#003153",
    "name": "Prussian Blue",
    "r": 0,
    "g": 49,
    "b": 83
  },
  {
    "hex": "#003366",
    "name": "Bismarck",
    "r": 0,
    "g": 51,
    "b": 102
  },
  {
    "hex": "#003399",
    "name": "Smalt",
    "r": 0,
    "g": 51,
    "b": 153
  },
  {
    "hex": "#003532",
    "name": "Deep Teal",
    "r": 0,
    "g": 53,
    "b": 50
  },
  {
    "hex": "#003E40",
    "name": "Cyprus",
    "r": 0,
    "g": 62,
    "b": 64
  },
  {
    "hex": "#004620",
    "name": "Kaitoke Green",
    "r": 0,
    "g": 70,
    "b": 32
  },
  {
    "hex": "#0047AB",
    "name": "Cobalt Blue",
    "r": 0,
    "g": 71,
    "b": 171
  },
  {
    "hex": "#004844",
    "name": "Blue Stone",
    "r": 0,
    "g": 72,
    "b": 68
  },
  {
    "hex": "#004950",
    "name": "Sherpa Blue",
    "r": 0,
    "g": 73,
    "b": 80
  },
  {
    "hex": "#004B49",
    "name": "Deep Sea",
    "r": 0,
    "g": 75,
    "b": 73
  },
  {
    "hex": "#00563B",
    "name": "Dark Spring Green",
    "r": 0,
    "g": 86,
    "b": 59
  },
  {
    "hex": "#006600",
    "name": "Office Green",
    "r": 0,
    "g": 102,
    "b": 0
  },
  {
    "hex": "#0066CC",
    "name": "Science Blue",
    "r": 0,
    "g": 102,
    "b": 204
  },
  {
    "hex": "#0066FF",
    "name": "Blue Ribbon",
    "r": 0,
    "g": 102,
    "b": 255
  },
  {
    "hex": "#0070FF",
    "name": "Azure Radiance",
    "r": 0,
    "g": 112,
    "b": 255
  },
  {
    "hex": "#0072BB",
    "name": "French Sky Blue",
    "r": 0,
    "g": 114,
    "b": 187
  },
  {
    "hex": "#00755E",
    "name": "Amazon",
    "r": 0,
    "g": 117,
    "b": 94
  },
  {
    "hex": "#0076A3",
    "name": "Celeste Blue",
    "r": 0,
    "g": 118,
    "b": 163
  },
  {
    "hex": "#007791",
    "name": "Skobeloff",
    "r": 0,
    "g": 119,
    "b": 145
  },
  {
    "hex": "#007BA7",
    "name": "Cerulean",
    "r": 0,
    "g": 123,
    "b": 167
  },
  {
    "hex": "#007EC7",
    "name": "Cerulean Blue",
    "r": 0,
    "g": 126,
    "b": 199
  },
  {
    "hex": "#007FFF",
    "name": "Azure",
    "r": 0,
    "g": 127,
    "b": 255
  },
  {
    "hex": "#008000",
    "name": "Green",
    "r": 0,
    "g": 128,
    "b": 0
  },
  {
    "hex": "#008080",
    "name": "Teal",
    "r": 0,
    "g": 128,
    "b": 128
  },
  {
    "hex": "#008B8B",
    "name": "Dark Cyan",
    "r": 0,
    "g": 139,
    "b": 139
  },
  {
    "hex": "#0095B6",
    "name": "Bondi Blue",
    "r": 0,
    "g": 149,
    "b": 182
  },
  {
    "hex": "#0099CC",
    "name": "Pacific Blue",
    "r": 0,
    "g": 153,
    "b": 204
  },
  {
    "hex": "#009DC4",
    "name": "Ocean Crest",
    "r": 0,
    "g": 157,
    "b": 196
  },
  {
    "hex": "#00A693",
    "name": "Persian Green",
    "r": 0,
    "g": 166,
    "b": 147
  },
  {
    "hex": "#00A877",
    "name": "Jade Green",
    "r": 0,
    "g": 168,
    "b": 119
  },
  {
    "hex": "#00BFFF",
    "name": "Deep Sky Blue",
    "r": 0,
    "g": 191,
    "b": 255
  },
  {
    "hex": "#00CED1",
    "name": "Turquoise Dark",
    "r": 0,
    "g": 206,
    "b": 209
  },
  {
    "hex": "#00E5EE",
    "name": "Turquoise Blue",
    "r": 0,
    "g": 229,
    "b": 238
  },
  {
    "hex": "#00FA9A",
    "name": "Medium Spring Green",
    "r": 0,
    "g": 250,
    "b": 154
  },
  {
    "hex": "#00FF00",
    "name": "Lime Green",
    "r": 0,
    "g": 255,
    "b": 0
  },
  {
    "hex": "#00FF7F",
    "name": "Spring Green",
    "r": 0,
    "g": 255,
    "b": 127
  },
  {
    "hex": "#00FFFF",
    "name": "Cyan / Aqua",
    "r": 0,
    "g": 255,
    "b": 255
  },
  {
    "hex": "#010D1A",
    "name": "Black Rock",
    "r": 1,
    "g": 13,
    "b": 26
  },
  {
    "hex": "#011635",
    "name": "Maastricht Blue",
    "r": 1,
    "g": 22,
    "b": 53
  },
  {
    "hex": "#011D13",
    "name": "Bush",
    "r": 1,
    "g": 29,
    "b": 19
  },
  {
    "hex": "#012731",
    "name": "Blue Dianne",
    "r": 1,
    "g": 39,
    "b": 49
  },
  {
    "hex": "#01361C",
    "name": "Phthalo Green",
    "r": 1,
    "g": 54,
    "b": 28
  },
  {
    "hex": "#013E62",
    "name": "Biscay",
    "r": 1,
    "g": 62,
    "b": 98
  },
  {
    "hex": "#015E85",
    "name": "Venice Blue",
    "r": 1,
    "g": 94,
    "b": 133
  },
  {
    "hex": "#016162",
    "name": "Watercourse",
    "r": 1,
    "g": 97,
    "b": 98
  },
  {
    "hex": "#01796F",
    "name": "Pine Green",
    "r": 1,
    "g": 121,
    "b": 111
  },
  {
    "hex": "#01826B",
    "name": "Lochmara",
    "r": 1,
    "g": 130,
    "b": 107
  },
  {
    "hex": "#022D15",
    "name": "Celtic",
    "r": 2,
    "g": 45,
    "b": 21
  },
  {
    "hex": "#02478E",
    "name": "Catalina Blue",
    "r": 2,
    "g": 71,
    "b": 142
  },
  {
    "hex": "#0263C0",
    "name": "Fun Blue",
    "r": 2,
    "g": 99,
    "b": 192
  },
  {
    "hex": "#0284C7",
    "name": "Light Sky Blue",
    "r": 2,
    "g": 132,
    "b": 199
  },
  {
    "hex": "#02866F",
    "name": "Observatory",
    "r": 2,
    "g": 134,
    "b": 111
  },
  {
    "hex": "#02A4D3",
    "name": "Capri",
    "r": 2,
    "g": 164,
    "b": 211
  },
  {
    "hex": "#03163C",
    "name": "Midnight",
    "r": 3,
    "g": 22,
    "b": 60
  },
  {
    "hex": "#032B52",
    "name": "Mirage",
    "r": 3,
    "g": 43,
    "b": 82
  },
  {
    "hex": "#0369A1",
    "name": "Ocean Blue",
    "r": 3,
    "g": 105,
    "b": 161
  },
  {
    "hex": "#041004",
    "name": "Gordons Green",
    "r": 4,
    "g": 16,
    "b": 4
  },
  {
    "hex": "#041322",
    "name": "Black Pearl",
    "r": 4,
    "g": 19,
    "b": 34
  },
  {
    "hex": "#042E4C",
    "name": "Tarawera",
    "r": 4,
    "g": 46,
    "b": 76
  },
  {
    "hex": "#044259",
    "name": "Elephant",
    "r": 4,
    "g": 66,
    "b": 89
  },
  {
    "hex": "#046E7B",
    "name": "Sea Green Deep",
    "r": 4,
    "g": 110,
    "b": 123
  },
  {
    "hex": "#051040",
    "name": "Dark Navy",
    "r": 5,
    "g": 16,
    "b": 64
  },
  {
    "hex": "#051657",
    "name": "Egyptian Blue",
    "r": 5,
    "g": 22,
    "b": 87
  },
  {
    "hex": "#055989",
    "name": "Allports",
    "r": 5,
    "g": 89,
    "b": 137
  },
  {
    "hex": "#056F57",
    "name": "Deep Emerald",
    "r": 5,
    "g": 111,
    "b": 87
  },
  {
    "hex": "#059669",
    "name": "Emerald Green",
    "r": 5,
    "g": 150,
    "b": 105
  },
  {
    "hex": "#062A78",
    "name": "Astronaut",
    "r": 6,
    "g": 42,
    "b": 120
  },
  {
    "hex": "#063537",
    "name": "Mosque",
    "r": 6,
    "g": 53,
    "b": 55
  },
  {
    "hex": "#069B76",
    "name": "Mountain Meadow",
    "r": 6,
    "g": 155,
    "b": 118
  },
  {
    "hex": "#073A50",
    "name": "Bahama Blue",
    "r": 7,
    "g": 58,
    "b": 80
  },
  {
    "hex": "#080110",
    "name": "Jackfly",
    "r": 8,
    "g": 1,
    "b": 16
  },
  {
    "hex": "#081910",
    "name": "Green Stone",
    "r": 8,
    "g": 25,
    "b": 16
  },
  {
    "hex": "#082567",
    "name": "Sapphire Dark",
    "r": 8,
    "g": 37,
    "b": 103
  },
  {
    "hex": "#08457E",
    "name": "Dark Cerulean",
    "r": 8,
    "g": 69,
    "b": 126
  },
  {
    "hex": "#088370",
    "name": "Tradewind",
    "r": 8,
    "g": 131,
    "b": 112
  },
  {
    "hex": "#09230F",
    "name": "Cardin Green",
    "r": 9,
    "g": 35,
    "b": 15
  },
  {
    "hex": "#09255D",
    "name": "Downriver",
    "r": 9,
    "g": 37,
    "b": 93
  },
  {
    "hex": "#093624",
    "name": "County Green",
    "r": 9,
    "g": 54,
    "b": 36
  },
  {
    "hex": "#097969",
    "name": "Cadet Green",
    "r": 9,
    "g": 121,
    "b": 105
  },
  {
    "hex": "#0A0F0D",
    "name": "Night",
    "r": 10,
    "g": 15,
    "b": 13
  },
  {
    "hex": "#0A480D",
    "name": "Parsley",
    "r": 10,
    "g": 72,
    "b": 13
  },
  {
    "hex": "#0A690C",
    "name": "Forest Green",
    "r": 10,
    "g": 105,
    "b": 12
  },
  {
    "hex": "#0B0B0B",
    "name": "Vampire Black",
    "r": 11,
    "g": 11,
    "b": 11
  },
  {
    "hex": "#0B1304",
    "name": "Black Forest",
    "r": 11,
    "g": 19,
    "b": 4
  },
  {
    "hex": "#0B3040",
    "name": "Blue Whale",
    "r": 11,
    "g": 48,
    "b": 64
  },
  {
    "hex": "#0B4873",
    "name": "Blumine",
    "r": 11,
    "g": 72,
    "b": 115
  },
  {
    "hex": "#0C0B1D",
    "name": "Ebony",
    "r": 12,
    "g": 11,
    "b": 29
  },
  {
    "hex": "#0C7A79",
    "name": "Teal Green",
    "r": 12,
    "g": 122,
    "b": 121
  },
  {
    "hex": "#0D0332",
    "name": "Vulcan",
    "r": 13,
    "g": 3,
    "b": 50
  },
  {
    "hex": "#0D1117",
    "name": "GitHub Dark",
    "r": 13,
    "g": 17,
    "b": 23
  },
  {
    "hex": "#0D9488",
    "name": "Teal Mint",
    "r": 13,
    "g": 148,
    "b": 136
  },
  {
    "hex": "#0E0E1A",
    "name": "Bunker",
    "r": 14,
    "g": 14,
    "b": 26
  },
  {
    "hex": "#0E7490",
    "name": "Cyan Blue",
    "r": 14,
    "g": 116,
    "b": 144
  },
  {
    "hex": "#0F172A",
    "name": "Slate 900",
    "r": 15,
    "g": 23,
    "b": 42
  },
  {
    "hex": "#0F2D9E",
    "name": "Royal Blue Dark",
    "r": 15,
    "g": 45,
    "b": 158
  },
  {
    "hex": "#0F4D81",
    "name": "Chathams Blue",
    "r": 15,
    "g": 77,
    "b": 129
  },
  {
    "hex": "#0F52BA",
    "name": "Sapphire",
    "r": 15,
    "g": 82,
    "b": 186
  },
  {
    "hex": "#101010",
    "name": "Smoky Black",
    "r": 16,
    "g": 16,
    "b": 16
  },
  {
    "hex": "#104E8B",
    "name": "Cobalt Light",
    "r": 16,
    "g": 78,
    "b": 139
  },
  {
    "hex": "#10B981",
    "name": "Vibrant Emerald",
    "r": 16,
    "g": 185,
    "b": 129
  },
  {
    "hex": "#111827",
    "name": "Gray 900",
    "r": 17,
    "g": 24,
    "b": 39
  },
  {
    "hex": "#120C1F",
    "name": "Revolver",
    "r": 18,
    "g": 12,
    "b": 31
  },
  {
    "hex": "#12160E",
    "name": "Black Olive",
    "r": 18,
    "g": 22,
    "b": 14
  },
  {
    "hex": "#122477",
    "name": "Dark Indigo",
    "r": 18,
    "g": 36,
    "b": 119
  },
  {
    "hex": "#123524",
    "name": "Phthalo Green",
    "r": 18,
    "g": 53,
    "b": 36
  },
  {
    "hex": "#130A06",
    "name": "Licorice",
    "r": 19,
    "g": 10,
    "b": 6
  },
  {
    "hex": "#141414",
    "name": "Eerie Black",
    "r": 20,
    "g": 20,
    "b": 20
  },
  {
    "hex": "#14532D",
    "name": "Forest 900",
    "r": 20,
    "g": 83,
    "b": 45
  },
  {
    "hex": "#151F4C",
    "name": "Lucky Point",
    "r": 21,
    "g": 31,
    "b": 76
  },
  {
    "hex": "#1560BD",
    "name": "Denim Blue",
    "r": 21,
    "g": 96,
    "b": 189
  },
  {
    "hex": "#15803D",
    "name": "Green 700",
    "r": 21,
    "g": 128,
    "b": 61
  },
  {
    "hex": "#161D10",
    "name": "Pine Tree",
    "r": 22,
    "g": 29,
    "b": 16
  },
  {
    "hex": "#164E63",
    "name": "Cyan 900",
    "r": 22,
    "g": 78,
    "b": 99
  },
  {
    "hex": "#16A34A",
    "name": "Green 600",
    "r": 22,
    "g": 163,
    "b": 74
  },
  {
    "hex": "#17142B",
    "name": "Mirage Dark",
    "r": 23,
    "g": 20,
    "b": 43
  },
  {
    "hex": "#18181B",
    "name": "Zinc 900",
    "r": 24,
    "g": 24,
    "b": 27
  },
  {
    "hex": "#191970",
    "name": "Midnight Blue",
    "r": 25,
    "g": 25,
    "b": 112
  },
  {
    "hex": "#1A1110",
    "name": "Licorice Root",
    "r": 26,
    "g": 17,
    "b": 16
  },
  {
    "hex": "#1A2421",
    "name": "Kombu Green",
    "r": 26,
    "g": 36,
    "b": 33
  },
  {
    "hex": "#1A365D",
    "name": "Yale Blue",
    "r": 26,
    "g": 54,
    "b": 93
  },
  {
    "hex": "#1B1B1B",
    "name": "Carbon",
    "r": 27,
    "g": 27,
    "b": 27
  },
  {
    "hex": "#1B263B",
    "name": "Yankees Blue",
    "r": 27,
    "g": 38,
    "b": 59
  },
  {
    "hex": "#1B4D3E",
    "name": "Brunswick Green",
    "r": 27,
    "g": 77,
    "b": 62
  },
  {
    "hex": "#1C1917",
    "name": "Stone 900",
    "r": 28,
    "g": 25,
    "b": 23
  },
  {
    "hex": "#1C2841",
    "name": "Steel Blue Dark",
    "r": 28,
    "g": 40,
    "b": 65
  },
  {
    "hex": "#1C39BB",
    "name": "Persian Blue",
    "r": 28,
    "g": 57,
    "b": 187
  },
  {
    "hex": "#1D4ED8",
    "name": "Blue 700",
    "r": 29,
    "g": 78,
    "b": 216
  },
  {
    "hex": "#1E1B4B",
    "name": "Indigo 950",
    "r": 30,
    "g": 27,
    "b": 75
  },
  {
    "hex": "#1E293B",
    "name": "Slate 800",
    "r": 30,
    "g": 41,
    "b": 59
  },
  {
    "hex": "#1E3A8A",
    "name": "Blue 900",
    "r": 30,
    "g": 58,
    "b": 138
  },
  {
    "hex": "#1E40AF",
    "name": "Blue 800",
    "r": 30,
    "g": 64,
    "b": 175
  },
  {
    "hex": "#1F2937",
    "name": "Gray 800",
    "r": 31,
    "g": 41,
    "b": 55
  },
  {
    "hex": "#20B2AA",
    "name": "Light Sea Green",
    "r": 32,
    "g": 178,
    "b": 170
  },
  {
    "hex": "#212121",
    "name": "Jet Black",
    "r": 33,
    "g": 33,
    "b": 33
  },
  {
    "hex": "#228B22",
    "name": "Forest Green",
    "r": 34,
    "g": 139,
    "b": 34
  },
  {
    "hex": "#22C55E",
    "name": "Green 500",
    "r": 34,
    "g": 197,
    "b": 94
  },
  {
    "hex": "#24292F",
    "name": "Charcoal Slate",
    "r": 36,
    "g": 41,
    "b": 47
  },
  {
    "hex": "#2563EB",
    "name": "Blue 600",
    "r": 37,
    "g": 99,
    "b": 235
  },
  {
    "hex": "#262626",
    "name": "Neutral 800",
    "r": 38,
    "g": 38,
    "b": 38
  },
  {
    "hex": "#27272A",
    "name": "Zinc 800",
    "r": 39,
    "g": 39,
    "b": 42
  },
  {
    "hex": "#282C34",
    "name": "One Dark Charcoal",
    "r": 40,
    "g": 44,
    "b": 52
  },
  {
    "hex": "#292524",
    "name": "Stone 800",
    "r": 41,
    "g": 37,
    "b": 36
  },
  {
    "hex": "#2A52BE",
    "name": "Cerulean Royal",
    "r": 42,
    "g": 82,
    "b": 190
  },
  {
    "hex": "#2B2B2B",
    "name": "Charcoal Dust",
    "r": 43,
    "g": 43,
    "b": 43
  },
  {
    "hex": "#2C3E50",
    "name": "Midnight Slate",
    "r": 44,
    "g": 62,
    "b": 80
  },
  {
    "hex": "#2D3748",
    "name": "Cool Slate Gray",
    "r": 45,
    "g": 55,
    "b": 72
  },
  {
    "hex": "#2DD4BF",
    "name": "Teal 400",
    "r": 45,
    "g": 212,
    "b": 191
  },
  {
    "hex": "#2E8B57",
    "name": "Sea Green Dark",
    "r": 46,
    "g": 139,
    "b": 87
  },
  {
    "hex": "#301934",
    "name": "Dark Purple",
    "r": 48,
    "g": 25,
    "b": 52
  },
  {
    "hex": "#312E81",
    "name": "Indigo 900",
    "r": 49,
    "g": 46,
    "b": 129
  },
  {
    "hex": "#32CD32",
    "name": "Lime Green Light",
    "r": 50,
    "g": 205,
    "b": 50
  },
  {
    "hex": "#333333",
    "name": "Dark Charcoal",
    "r": 51,
    "g": 51,
    "b": 51
  },
  {
    "hex": "#334155",
    "name": "Slate 700",
    "r": 51,
    "g": 65,
    "b": 85
  },
  {
    "hex": "#34495E",
    "name": "Wet Asphalt",
    "r": 52,
    "g": 73,
    "b": 94
  },
  {
    "hex": "#34D399",
    "name": "Emerald 400",
    "r": 52,
    "g": 211,
    "b": 153
  },
  {
    "hex": "#353839",
    "name": "Onyx Black",
    "r": 53,
    "g": 56,
    "b": 57
  },
  {
    "hex": "#3730A3",
    "name": "Indigo 800",
    "r": 55,
    "g": 48,
    "b": 163
  },
  {
    "hex": "#374151",
    "name": "Gray 700",
    "r": 55,
    "g": 65,
    "b": 81
  },
  {
    "hex": "#38BDF8",
    "name": "Sky Blue 400",
    "r": 56,
    "g": 189,
    "b": 248
  },
  {
    "hex": "#39FF14",
    "name": "Neon Green",
    "r": 57,
    "g": 255,
    "b": 20
  },
  {
    "hex": "#3B82F6",
    "name": "Dodger Blue",
    "r": 59,
    "g": 130,
    "b": 246
  },
  {
    "hex": "#3CB371",
    "name": "Medium Sea Green",
    "r": 60,
    "g": 179,
    "b": 113
  },
  {
    "hex": "#3E2723",
    "name": "Espresso Dark",
    "r": 62,
    "g": 39,
    "b": 35
  },
  {
    "hex": "#40E0D0",
    "name": "Turquoise",
    "r": 64,
    "g": 224,
    "b": 208
  },
  {
    "hex": "#4169E1",
    "name": "Royal Blue",
    "r": 65,
    "g": 105,
    "b": 225
  },
  {
    "hex": "#4338CA",
    "name": "Indigo 700",
    "r": 67,
    "g": 56,
    "b": 202
  },
  {
    "hex": "#44403C",
    "name": "Stone 700",
    "r": 68,
    "g": 64,
    "b": 60
  },
  {
    "hex": "#455A64",
    "name": "Blue Grey",
    "r": 69,
    "g": 90,
    "b": 100
  },
  {
    "hex": "#4682B4",
    "name": "Steel Blue",
    "r": 70,
    "g": 130,
    "b": 180
  },
  {
    "hex": "#475569",
    "name": "Slate 600",
    "r": 71,
    "g": 85,
    "b": 105
  },
  {
    "hex": "#4ADE80",
    "name": "Green 400",
    "r": 74,
    "g": 222,
    "b": 128
  },
  {
    "hex": "#4B0082",
    "name": "Indigo",
    "r": 75,
    "g": 0,
    "b": 130
  },
  {
    "hex": "#4B5563",
    "name": "Gray 600",
    "r": 75,
    "g": 85,
    "b": 99
  },
  {
    "hex": "#4C1D95",
    "name": "Violet 900",
    "r": 76,
    "g": 29,
    "b": 149
  },
  {
    "hex": "#4F46E5",
    "name": "Indigo 600",
    "r": 79,
    "g": 70,
    "b": 229
  },
  {
    "hex": "#525252",
    "name": "Neutral 600",
    "r": 82,
    "g": 82,
    "b": 82
  },
  {
    "hex": "#52525B",
    "name": "Zinc 600",
    "r": 82,
    "g": 82,
    "b": 91
  },
  {
    "hex": "#556B2F",
    "name": "Olive Drab",
    "r": 85,
    "g": 107,
    "b": 47
  },
  {
    "hex": "#581C87",
    "name": "Purple 900",
    "r": 88,
    "g": 28,
    "b": 135
  },
  {
    "hex": "#5B21B6",
    "name": "Violet 800",
    "r": 91,
    "g": 33,
    "b": 182
  },
  {
    "hex": "#5EEAD4",
    "name": "Teal 300",
    "r": 94,
    "g": 234,
    "b": 212
  },
  {
    "hex": "#60A5FA",
    "name": "Blue 400",
    "r": 96,
    "g": 165,
    "b": 250
  },
  {
    "hex": "#6366F1",
    "name": "Indigo 500",
    "r": 99,
    "g": 102,
    "b": 241
  },
  {
    "hex": "#64748B",
    "name": "Slate 500",
    "r": 100,
    "g": 116,
    "b": 139
  },
  {
    "hex": "#663399",
    "name": "Rebecca Purple",
    "r": 102,
    "g": 51,
    "b": 153
  },
  {
    "hex": "#66CDAA",
    "name": "Medium Aquamarine",
    "r": 102,
    "g": 205,
    "b": 170
  },
  {
    "hex": "#67E8F9",
    "name": "Cyan 300",
    "r": 103,
    "g": 232,
    "b": 249
  },
  {
    "hex": "#6A0DAD",
    "name": "Purple",
    "r": 106,
    "g": 13,
    "b": 173
  },
  {
    "hex": "#6A5ACD",
    "name": "Slate Blue",
    "r": 106,
    "g": 90,
    "b": 205
  },
  {
    "hex": "#6B21A8",
    "name": "Purple 800",
    "r": 107,
    "g": 33,
    "b": 168
  },
  {
    "hex": "#6B7280",
    "name": "Gray 500",
    "r": 107,
    "g": 114,
    "b": 128
  },
  {
    "hex": "#6D28D9",
    "name": "Violet 700",
    "r": 109,
    "g": 40,
    "b": 217
  },
  {
    "hex": "#708090",
    "name": "Slate Gray",
    "r": 112,
    "g": 128,
    "b": 144
  },
  {
    "hex": "#713F12",
    "name": "Yellow 900",
    "r": 113,
    "g": 63,
    "b": 18
  },
  {
    "hex": "#71717A",
    "name": "Zinc 500",
    "r": 113,
    "g": 113,
    "b": 122
  },
  {
    "hex": "#737373",
    "name": "Neutral 500",
    "r": 115,
    "g": 115,
    "b": 115
  },
  {
    "hex": "#78350F",
    "name": "Amber 900",
    "r": 120,
    "g": 53,
    "b": 15
  },
  {
    "hex": "#78716C",
    "name": "Stone 500",
    "r": 120,
    "g": 113,
    "b": 108
  },
  {
    "hex": "#7C2D12",
    "name": "Orange 900",
    "r": 124,
    "g": 45,
    "b": 18
  },
  {
    "hex": "#7C3AED",
    "name": "Violet 600",
    "r": 124,
    "g": 58,
    "b": 237
  },
  {
    "hex": "#7E22CE",
    "name": "Purple 700",
    "r": 126,
    "g": 34,
    "b": 206
  },
  {
    "hex": "#7FFFD4",
    "name": "Aquamarine",
    "r": 127,
    "g": 255,
    "b": 212
  },
  {
    "hex": "#800000",
    "name": "Maroon",
    "r": 128,
    "g": 0,
    "b": 0
  },
  {
    "hex": "#800080",
    "name": "Purple Deep",
    "r": 128,
    "g": 0,
    "b": 128
  },
  {
    "hex": "#808000",
    "name": "Olive",
    "r": 128,
    "g": 128,
    "b": 0
  },
  {
    "hex": "#808080",
    "name": "Gray",
    "r": 128,
    "g": 128,
    "b": 128
  },
  {
    "hex": "#831843",
    "name": "Pink 900",
    "r": 131,
    "g": 24,
    "b": 67
  },
  {
    "hex": "#84CC16",
    "name": "Lime 500",
    "r": 132,
    "g": 204,
    "b": 22
  },
  {
    "hex": "#854D0E",
    "name": "Yellow 800",
    "r": 133,
    "g": 77,
    "b": 14
  },
  {
    "hex": "#86EFAC",
    "name": "Green 300",
    "r": 134,
    "g": 239,
    "b": 172
  },
  {
    "hex": "#87CEEB",
    "name": "Sky Blue",
    "r": 135,
    "g": 206,
    "b": 235
  },
  {
    "hex": "#87CEFA",
    "name": "Light Sky Blue",
    "r": 135,
    "g": 206,
    "b": 250
  },
  {
    "hex": "#881337",
    "name": "Rose 900",
    "r": 136,
    "g": 19,
    "b": 55
  },
  {
    "hex": "#8A2BE2",
    "name": "Blue Violet",
    "r": 138,
    "g": 43,
    "b": 226
  },
  {
    "hex": "#8B0000",
    "name": "Dark Red",
    "r": 139,
    "g": 0,
    "b": 0
  },
  {
    "hex": "#8B008B",
    "name": "Dark Magenta",
    "r": 139,
    "g": 0,
    "b": 139
  },
  {
    "hex": "#8B4513",
    "name": "Saddle Brown",
    "r": 139,
    "g": 69,
    "b": 19
  },
  {
    "hex": "#8B5CF6",
    "name": "Violet 500",
    "r": 139,
    "g": 92,
    "b": 246
  },
  {
    "hex": "#8ECAE6",
    "name": "Soft Blue",
    "r": 142,
    "g": 202,
    "b": 230
  },
  {
    "hex": "#90EE90",
    "name": "Light Green",
    "r": 144,
    "g": 238,
    "b": 144
  },
  {
    "hex": "#92400E",
    "name": "Amber 800",
    "r": 146,
    "g": 64,
    "b": 14
  },
  {
    "hex": "#9333EA",
    "name": "Purple 600",
    "r": 147,
    "g": 51,
    "b": 234
  },
  {
    "hex": "#93C5FD",
    "name": "Blue 300",
    "r": 147,
    "g": 197,
    "b": 253
  },
  {
    "hex": "#94A3B8",
    "name": "Slate 400",
    "r": 148,
    "g": 163,
    "b": 184
  },
  {
    "hex": "#990000",
    "name": "Crimson Deep",
    "r": 153,
    "g": 0,
    "b": 0
  },
  {
    "hex": "#991B1B",
    "name": "Red 800",
    "r": 153,
    "g": 27,
    "b": 27
  },
  {
    "hex": "#9932CC",
    "name": "Dark Orchid",
    "r": 153,
    "g": 50,
    "b": 204
  },
  {
    "hex": "#9966CC",
    "name": "Amethyst Purple",
    "r": 153,
    "g": 102,
    "b": 204
  },
  {
    "hex": "#9A3412",
    "name": "Orange 800",
    "r": 154,
    "g": 52,
    "b": 18
  },
  {
    "hex": "#9CA3AF",
    "name": "Gray 400",
    "r": 156,
    "g": 163,
    "b": 175
  },
  {
    "hex": "#9D174D",
    "name": "Pink 800",
    "r": 157,
    "g": 23,
    "b": 77
  },
  {
    "hex": "#9E7B66",
    "name": "Warm Taupe",
    "r": 158,
    "g": 123,
    "b": 102
  },
  {
    "hex": "#9F1239",
    "name": "Rose 800",
    "r": 159,
    "g": 18,
    "b": 57
  },
  {
    "hex": "#A0522D",
    "name": "Sienna Brown",
    "r": 160,
    "g": 82,
    "b": 45
  },
  {
    "hex": "#A1A1AA",
    "name": "Zinc 400",
    "r": 161,
    "g": 161,
    "b": 170
  },
  {
    "hex": "#A21CAF",
    "name": "Fuchsia 700",
    "r": 162,
    "g": 28,
    "b": 175
  },
  {
    "hex": "#A3A3A3",
    "name": "Neutral 400",
    "r": 163,
    "g": 163,
    "b": 163
  },
  {
    "hex": "#A3E635",
    "name": "Lime 400",
    "r": 163,
    "g": 230,
    "b": 53
  },
  {
    "hex": "#A52A2A",
    "name": "Auburn",
    "r": 165,
    "g": 42,
    "b": 42
  },
  {
    "hex": "#A78BFA",
    "name": "Violet 400",
    "r": 167,
    "g": 139,
    "b": 250
  },
  {
    "hex": "#A855F7",
    "name": "Purple 500",
    "r": 168,
    "g": 85,
    "b": 247
  },
  {
    "hex": "#A8A29E",
    "name": "Stone 400",
    "r": 168,
    "g": 162,
    "b": 158
  },
  {
    "hex": "#AA336A",
    "name": "Dark Pink",
    "r": 170,
    "g": 51,
    "b": 106
  },
  {
    "hex": "#AA98A9",
    "name": "Dusty Lavender",
    "r": 170,
    "g": 152,
    "b": 169
  },
  {
    "hex": "#B0C4DE",
    "name": "Light Steel Blue",
    "r": 176,
    "g": 196,
    "b": 222
  },
  {
    "hex": "#B0E0E6",
    "name": "Powder Blue",
    "r": 176,
    "g": 224,
    "b": 230
  },
  {
    "hex": "#B45309",
    "name": "Amber 700",
    "r": 180,
    "g": 83,
    "b": 9
  },
  {
    "hex": "#B6D7A8",
    "name": "Celadon Light",
    "r": 182,
    "g": 215,
    "b": 168
  },
  {
    "hex": "#B8860B",
    "name": "Goldenrod Dark",
    "r": 184,
    "g": 134,
    "b": 11
  },
  {
    "hex": "#B91C1C",
    "name": "Red 700",
    "r": 185,
    "g": 28,
    "b": 28
  },
  {
    "hex": "#BA55D3",
    "name": "Medium Orchid",
    "r": 186,
    "g": 85,
    "b": 211
  },
  {
    "hex": "#BBF7D0",
    "name": "Green 200",
    "r": 187,
    "g": 247,
    "b": 208
  },
  {
    "hex": "#BC8F8F",
    "name": "Rosy Brown",
    "r": 188,
    "g": 143,
    "b": 143
  },
  {
    "hex": "#BE123C",
    "name": "Rose 700",
    "r": 190,
    "g": 18,
    "b": 60
  },
  {
    "hex": "#BE185D",
    "name": "Pink 700",
    "r": 190,
    "g": 24,
    "b": 93
  },
  {
    "hex": "#BEF264",
    "name": "Lime 300",
    "r": 190,
    "g": 242,
    "b": 100
  },
  {
    "hex": "#BFDBFE",
    "name": "Blue 200",
    "r": 191,
    "g": 219,
    "b": 254
  },
  {
    "hex": "#C026D3",
    "name": "Fuchsia 600",
    "r": 192,
    "g": 38,
    "b": 211
  },
  {
    "hex": "#C084FC",
    "name": "Purple 400",
    "r": 192,
    "g": 132,
    "b": 252
  },
  {
    "hex": "#C0C0C0",
    "name": "Silver",
    "r": 192,
    "g": 192,
    "b": 192
  },
  {
    "hex": "#C2410C",
    "name": "Orange 700",
    "r": 194,
    "g": 65,
    "b": 12
  },
  {
    "hex": "#C4B5FD",
    "name": "Violet 300",
    "r": 196,
    "g": 181,
    "b": 253
  },
  {
    "hex": "#C7D2FE",
    "name": "Indigo 200",
    "r": 199,
    "g": 210,
    "b": 254
  },
  {
    "hex": "#CA8A04",
    "name": "Yellow 600",
    "r": 202,
    "g": 138,
    "b": 4
  },
  {
    "hex": "#CBD5E1",
    "name": "Slate 300",
    "r": 203,
    "g": 213,
    "b": 225
  },
  {
    "hex": "#CD5C5C",
    "name": "Indian Red Coral",
    "r": 205,
    "g": 92,
    "b": 92
  },
  {
    "hex": "#CD7F32",
    "name": "Bronze",
    "r": 205,
    "g": 127,
    "b": 50
  },
  {
    "hex": "#CD853F",
    "name": "Peru Brown",
    "r": 205,
    "g": 133,
    "b": 63
  },
  {
    "hex": "#D1D5DB",
    "name": "Gray 300",
    "r": 209,
    "g": 213,
    "b": 219
  },
  {
    "hex": "#D2691E",
    "name": "Cinnamon Spice",
    "r": 210,
    "g": 105,
    "b": 30
  },
  {
    "hex": "#D2B48C",
    "name": "Tan",
    "r": 210,
    "g": 180,
    "b": 140
  },
  {
    "hex": "#D4D4D4",
    "name": "Neutral 300",
    "r": 212,
    "g": 212,
    "b": 212
  },
  {
    "hex": "#D4D4D8",
    "name": "Zinc 300",
    "r": 212,
    "g": 212,
    "b": 216
  },
  {
    "hex": "#D6D3D1",
    "name": "Stone 300",
    "r": 214,
    "g": 211,
    "b": 209
  },
  {
    "hex": "#D8B4FE",
    "name": "Purple 300",
    "r": 216,
    "g": 180,
    "b": 254
  },
  {
    "hex": "#D946EF",
    "name": "Fuchsia 500",
    "r": 217,
    "g": 70,
    "b": 239
  },
  {
    "hex": "#D97706",
    "name": "Amber 600",
    "r": 217,
    "g": 119,
    "b": 6
  },
  {
    "hex": "#DA70D6",
    "name": "Orchid Bloom",
    "r": 218,
    "g": 112,
    "b": 214
  },
  {
    "hex": "#DA9100",
    "name": "Harvest Gold",
    "r": 218,
    "g": 145,
    "b": 0
  },
  {
    "hex": "#DAA520",
    "name": "Goldenrod",
    "r": 218,
    "g": 165,
    "b": 32
  },
  {
    "hex": "#DC2626",
    "name": "Red 600",
    "r": 220,
    "g": 38,
    "b": 38
  },
  {
    "hex": "#DB2777",
    "name": "Pink 600",
    "r": 219,
    "g": 39,
    "b": 119
  },
  {
    "hex": "#DC143C",
    "name": "Crimson",
    "r": 220,
    "g": 20,
    "b": 60
  },
  {
    "hex": "#DDD6FE",
    "name": "Violet 200",
    "r": 221,
    "g": 214,
    "b": 254
  },
  {
    "hex": "#DEB887",
    "name": "Burlywood",
    "r": 222,
    "g": 184,
    "b": 135
  },
  {
    "hex": "#DFA979",
    "name": "Desert Sand",
    "r": 223,
    "g": 169,
    "b": 121
  },
  {
    "hex": "#DFB97D",
    "name": "Ecru",
    "r": 223,
    "g": 185,
    "b": 125
  },
  {
    "hex": "#E06666",
    "name": "Muted Red",
    "r": 224,
    "g": 102,
    "b": 102
  },
  {
    "hex": "#E0E7FF",
    "name": "Indigo 100",
    "r": 224,
    "g": 231,
    "b": 255
  },
  {
    "hex": "#E0F2FE",
    "name": "Sky Blue 100",
    "r": 224,
    "g": 242,
    "b": 254
  },
  {
    "hex": "#E11D48",
    "name": "Rose 600",
    "r": 225,
    "g": 29,
    "b": 72
  },
  {
    "hex": "#E2E8F0",
    "name": "Slate 200",
    "r": 226,
    "g": 232,
    "b": 240
  },
  {
    "hex": "#E4E4E7",
    "name": "Zinc 200",
    "r": 228,
    "g": 228,
    "b": 231
  },
  {
    "hex": "#E5E5E5",
    "name": "Neutral 200",
    "r": 229,
    "g": 229,
    "b": 229
  },
  {
    "hex": "#E5E7EB",
    "name": "Gray 200",
    "r": 229,
    "g": 231,
    "b": 235
  },
  {
    "hex": "#E6E6FA",
    "name": "Lavender",
    "r": 230,
    "g": 230,
    "b": 250
  },
  {
    "hex": "#E7E5E4",
    "name": "Stone 200",
    "r": 231,
    "g": 229,
    "b": 228
  },
  {
    "hex": "#EA580C",
    "name": "Orange 600",
    "r": 234,
    "g": 88,
    "b": 12
  },
  {
    "hex": "#EAB308",
    "name": "Yellow 500",
    "r": 234,
    "g": 179,
    "b": 8
  },
  {
    "hex": "#EE82EE",
    "name": "Violet Light",
    "r": 238,
    "g": 130,
    "b": 238
  },
  {
    "hex": "#EEC590",
    "name": "Bisque Tan",
    "r": 238,
    "g": 197,
    "b": 144
  },
  {
    "hex": "#EF4444",
    "name": "Red 500",
    "r": 239,
    "g": 68,
    "b": 68
  },
  {
    "hex": "#F08080",
    "name": "Light Coral",
    "r": 240,
    "g": 128,
    "b": 128
  },
  {
    "hex": "#F0E68C",
    "name": "Khaki",
    "r": 240,
    "g": 230,
    "b": 140
  },
  {
    "hex": "#F0F9FF",
    "name": "Sky Blue 50",
    "r": 240,
    "g": 249,
    "b": 255
  },
  {
    "hex": "#F0FDF4",
    "name": "Green 50",
    "r": 240,
    "g": 253,
    "b": 244
  },
  {
    "hex": "#F0FDFA",
    "name": "Teal 50",
    "r": 240,
    "g": 253,
    "b": 250
  },
  {
    "hex": "#F1F5F9",
    "name": "Slate 100",
    "r": 241,
    "g": 245,
    "b": 249
  },
  {
    "hex": "#F3E8FF",
    "name": "Purple 100",
    "r": 243,
    "g": 232,
    "b": 255
  },
  {
    "hex": "#F3F4F6",
    "name": "Gray 100",
    "r": 243,
    "g": 244,
    "b": 246
  },
  {
    "hex": "#F43F5E",
    "name": "Rose 500",
    "r": 244,
    "g": 63,
    "b": 94
  },
  {
    "hex": "#F472B6",
    "name": "Pink 400",
    "r": 244,
    "g": 114,
    "b": 182
  },
  {
    "hex": "#F4A460",
    "name": "Sandy Brown",
    "r": 244,
    "g": 164,
    "b": 96
  },
  {
    "hex": "#F4F4F5",
    "name": "Zinc 100",
    "r": 244,
    "g": 244,
    "b": 245
  },
  {
    "hex": "#F59E0B",
    "name": "Amber 500",
    "r": 245,
    "g": 158,
    "b": 11
  },
  {
    "hex": "#F5F5DC",
    "name": "Beige",
    "r": 245,
    "g": 245,
    "b": 220
  },
  {
    "hex": "#F5F5F5",
    "name": "White Smoke",
    "r": 245,
    "g": 245,
    "b": 245
  },
  {
    "hex": "#F5F3FF",
    "name": "Violet 50",
    "r": 245,
    "g": 243,
    "b": 255
  },
  {
    "hex": "#F5F5F4",
    "name": "Stone 100",
    "r": 245,
    "g": 245,
    "b": 244
  },
  {
    "hex": "#F6E05E",
    "name": "Muted Yellow",
    "r": 246,
    "g": 224,
    "b": 94
  },
  {
    "hex": "#F7FEE7",
    "name": "Lime 50",
    "r": 247,
    "g": 254,
    "b": 231
  },
  {
    "hex": "#F87171",
    "name": "Red 400",
    "r": 248,
    "g": 113,
    "b": 113
  },
  {
    "hex": "#F8FAFC",
    "name": "Slate 50",
    "r": 248,
    "g": 250,
    "b": 252
  },
  {
    "hex": "#F97316",
    "name": "Orange 500",
    "r": 249,
    "g": 115,
    "b": 22
  },
  {
    "hex": "#F9A8D4",
    "name": "Pink 300",
    "r": 249,
    "g": 168,
    "b": 212
  },
  {
    "hex": "#F9FAFB",
    "name": "Gray 50",
    "r": 249,
    "g": 250,
    "b": 251
  },
  {
    "hex": "#FA8072",
    "name": "Salmon Pink",
    "r": 250,
    "g": 128,
    "b": 114
  },
  {
    "hex": "#FAF5FF",
    "name": "Purple 50",
    "r": 250,
    "g": 245,
    "b": 255
  },
  {
    "hex": "#FAFAF9",
    "name": "Stone 50",
    "r": 250,
    "g": 250,
    "b": 249
  },
  {
    "hex": "#FAFAFA",
    "name": "Neutral 50",
    "r": 250,
    "g": 250,
    "b": 250
  },
  {
    "hex": "#FB7185",
    "name": "Rose 400",
    "r": 251,
    "g": 113,
    "b": 133
  },
  {
    "hex": "#FB923C",
    "name": "Orange 400",
    "r": 251,
    "g": 146,
    "b": 60
  },
  {
    "hex": "#FBBF24",
    "name": "Amber 400",
    "r": 251,
    "g": 191,
    "b": 36
  },
  {
    "hex": "#FBCFE8",
    "name": "Pink 200",
    "r": 251,
    "g": 207,
    "b": 232
  },
  {
    "hex": "#FCD34D",
    "name": "Amber 300",
    "r": 252,
    "g": 211,
    "b": 77
  },
  {
    "hex": "#FCE7F3",
    "name": "Pink 100",
    "r": 252,
    "g": 231,
    "b": 243
  },
  {
    "hex": "#FDBA74",
    "name": "Orange 300",
    "r": 253,
    "g": 186,
    "b": 116
  },
  {
    "hex": "#FDE047",
    "name": "Yellow 300",
    "r": 253,
    "g": 224,
    "b": 71
  },
  {
    "hex": "#FDE68A",
    "name": "Amber 200",
    "r": 253,
    "g": 230,
    "b": 138
  },
  {
    "hex": "#FEF08A",
    "name": "Yellow 200",
    "r": 254,
    "g": 240,
    "b": 138
  },
  {
    "hex": "#FEF2F2",
    "name": "Red 50",
    "r": 254,
    "g": 242,
    "b": 242
  },
  {
    "hex": "#FEF3C7",
    "name": "Amber 100",
    "r": 254,
    "g": 243,
    "b": 199
  },
  {
    "hex": "#FEF9C3",
    "name": "Yellow 100",
    "r": 254,
    "g": 249,
    "b": 195
  },
  {
    "hex": "#FEFCE8",
    "name": "Yellow 50",
    "r": 254,
    "g": 252,
    "b": 232
  },
  {
    "hex": "#FEFFDF",
    "name": "Light Cream",
    "r": 254,
    "g": 255,
    "b": 223
  },
  {
    "hex": "#FF0000",
    "name": "Red",
    "r": 255,
    "g": 0,
    "b": 0
  },
  {
    "hex": "#FF007F",
    "name": "Rose Pink",
    "r": 255,
    "g": 0,
    "b": 127
  },
  {
    "hex": "#FF00FF",
    "name": "Magenta / Fuchsia",
    "r": 255,
    "g": 0,
    "b": 255
  },
  {
    "hex": "#FF1493",
    "name": "Deep Shocking Pink",
    "r": 255,
    "g": 20,
    "b": 147
  },
  {
    "hex": "#FF2400",
    "name": "Scarlet",
    "r": 255,
    "g": 36,
    "b": 0
  },
  {
    "hex": "#FF4500",
    "name": "Orange Ember",
    "r": 255,
    "g": 69,
    "b": 0
  },
  {
    "hex": "#FF4F00",
    "name": "International Orange",
    "r": 255,
    "g": 79,
    "b": 0
  },
  {
    "hex": "#FF6347",
    "name": "Tomato",
    "r": 255,
    "g": 99,
    "b": 71
  },
  {
    "hex": "#FF69B4",
    "name": "Hot Pink",
    "r": 255,
    "g": 105,
    "b": 180
  },
  {
    "hex": "#FF7F50",
    "name": "Coral",
    "r": 255,
    "g": 127,
    "b": 80
  },
  {
    "hex": "#FF8C00",
    "name": "Dark Sun Orange",
    "r": 255,
    "g": 140,
    "b": 0
  },
  {
    "hex": "#FFA07A",
    "name": "Light Salmon Dawn",
    "r": 255,
    "g": 160,
    "b": 122
  },
  {
    "hex": "#FFA500",
    "name": "Orange",
    "r": 255,
    "g": 165,
    "b": 0
  },
  {
    "hex": "#FFB6C1",
    "name": "Light Pink",
    "r": 255,
    "g": 182,
    "b": 193
  },
  {
    "hex": "#FFBF00",
    "name": "Amber",
    "r": 255,
    "g": 191,
    "b": 0
  },
  {
    "hex": "#FFC0CB",
    "name": "Baby Pink",
    "r": 255,
    "g": 192,
    "b": 203
  },
  {
    "hex": "#FFD700",
    "name": "Pure Gold",
    "r": 255,
    "g": 215,
    "b": 0
  },
  {
    "hex": "#FFDAB9",
    "name": "Peach Puff",
    "r": 255,
    "g": 218,
    "b": 185
  },
  {
    "hex": "#FFDEAD",
    "name": "Navajo White",
    "r": 255,
    "g": 222,
    "b": 173
  },
  {
    "hex": "#FFE4B5",
    "name": "Moccasin Sand",
    "r": 255,
    "g": 228,
    "b": 181
  },
  {
    "hex": "#FFE4C4",
    "name": "Bisque",
    "r": 255,
    "g": 228,
    "b": 196
  },
  {
    "hex": "#FFE4E1",
    "name": "Misty Rose",
    "r": 255,
    "g": 228,
    "b": 225
  },
  {
    "hex": "#FFEBCD",
    "name": "Blanched Almond",
    "r": 255,
    "g": 235,
    "b": 205
  },
  {
    "hex": "#FFEFD5",
    "name": "Papaya Whip",
    "r": 255,
    "g": 239,
    "b": 213
  },
  {
    "hex": "#FFF0F5",
    "name": "Lavender Blush",
    "r": 255,
    "g": 240,
    "b": 245
  },
  {
    "hex": "#FFF5EE",
    "name": "Seashell",
    "r": 255,
    "g": 245,
    "b": 238
  },
  {
    "hex": "#FFF8DC",
    "name": "Cornsilk",
    "r": 255,
    "g": 248,
    "b": 220
  },
  {
    "hex": "#FFFAF0",
    "name": "Floral White",
    "r": 255,
    "g": 250,
    "b": 240
  },
  {
    "hex": "#FFFAFA",
    "name": "Snow",
    "r": 255,
    "g": 250,
    "b": 250
  },
  {
    "hex": "#FFFF00",
    "name": "Yellow",
    "r": 255,
    "g": 255,
    "b": 0
  },
  {
    "hex": "#FFFFE0",
    "name": "Light Yellow",
    "r": 255,
    "g": 255,
    "b": 224
  },
  {
    "hex": "#FFFFF0",
    "name": "Ivory",
    "r": 255,
    "g": 255,
    "b": 240
  },
  {
    "hex": "#FFFFFF",
    "name": "White",
    "r": 255,
    "g": 255,
    "b": 255
  },
  {
    "hex": "#004040",
    "name": "Teal Deep",
    "r": 0,
    "g": 64,
    "b": 64
  },
  {
    "hex": "#00563F",
    "name": "Evergreen",
    "r": 0,
    "g": 86,
    "b": 63
  },
  {
    "hex": "#00695C",
    "name": "Bottle Green",
    "r": 0,
    "g": 105,
    "b": 92
  },
  {
    "hex": "#007474",
    "name": "Verdigris",
    "r": 0,
    "g": 116,
    "b": 116
  },
  {
    "hex": "#00827F",
    "name": "Blue Lagoon",
    "r": 0,
    "g": 130,
    "b": 127
  },
  {
    "hex": "#009999",
    "name": "Teal Light",
    "r": 0,
    "g": 153,
    "b": 153
  },
  {
    "hex": "#00A36C",
    "name": "Jade",
    "r": 0,
    "g": 163,
    "b": 108
  },
  {
    "hex": "#00AB66",
    "name": "Malachite",
    "r": 0,
    "g": 171,
    "b": 102
  },
  {
    "hex": "#00B7EB",
    "name": "Cyan Electric",
    "r": 0,
    "g": 183,
    "b": 235
  },
  {
    "hex": "#00C4B4",
    "name": "Robin Egg Blue",
    "r": 0,
    "g": 196,
    "b": 180
  },
  {
    "hex": "#1E3F20",
    "name": "Pine Tree",
    "r": 30,
    "g": 63,
    "b": 32
  },
  {
    "hex": "#20603D",
    "name": "Hunter Green",
    "r": 32,
    "g": 96,
    "b": 61
  },
  {
    "hex": "#24445C",
    "name": "Nordic Blue",
    "r": 36,
    "g": 68,
    "b": 92
  },
  {
    "hex": "#2979FF",
    "name": "Blue Accent",
    "r": 41,
    "g": 121,
    "b": 255
  },
  {
    "hex": "#2B3990",
    "name": "Indigo Dye",
    "r": 43,
    "g": 57,
    "b": 144
  },
  {
    "hex": "#321414",
    "name": "Dark Roast",
    "r": 50,
    "g": 20,
    "b": 20
  },
  {
    "hex": "#34282C",
    "name": "Charcoal Heather",
    "r": 52,
    "g": 40,
    "b": 44
  },
  {
    "hex": "#36454F",
    "name": "Charcoal",
    "r": 54,
    "g": 69,
    "b": 79
  },
  {
    "hex": "#3B3C36",
    "name": "Black Olive",
    "r": 59,
    "g": 60,
    "b": 54
  },
  {
    "hex": "#3D2B1F",
    "name": "Bistre",
    "r": 61,
    "g": 43,
    "b": 31
  },
  {
    "hex": "#41424C",
    "name": "Castleton Green",
    "r": 65,
    "g": 66,
    "b": 76
  },
  {
    "hex": "#43270F",
    "name": "Dark Espresso",
    "r": 67,
    "g": 39,
    "b": 15
  },
  {
    "hex": "#4A0E17",
    "name": "Bordeaux",
    "r": 74,
    "g": 14,
    "b": 23
  },
  {
    "hex": "#4B3621",
    "name": "Café Noir",
    "r": 75,
    "g": 54,
    "b": 33
  },
  {
    "hex": "#4B5320",
    "name": "Army Green",
    "r": 75,
    "g": 83,
    "b": 32
  },
  {
    "hex": "#534B4F",
    "name": "Liver",
    "r": 83,
    "g": 75,
    "b": 79
  },
  {
    "hex": "#592720",
    "name": "Caput Mortuum",
    "r": 89,
    "g": 39,
    "b": 32
  },
  {
    "hex": "#5D3954",
    "name": "Halaya Ube",
    "r": 93,
    "g": 57,
    "b": 84
  },
  {
    "hex": "#5D8AA8",
    "name": "Air Force Blue",
    "r": 93,
    "g": 138,
    "b": 168
  },
  {
    "hex": "#665D1E",
    "name": "Antique Bronze",
    "r": 102,
    "g": 93,
    "b": 30
  },
  {
    "hex": "#696969",
    "name": "Dim Gray",
    "r": 105,
    "g": 105,
    "b": 105
  },
  {
    "hex": "#6B4423",
    "name": "Russet",
    "r": 107,
    "g": 68,
    "b": 35
  },
  {
    "hex": "#6C541E",
    "name": "Field Drab",
    "r": 108,
    "g": 84,
    "b": 30
  },
  {
    "hex": "#6F4E37",
    "name": "Coffee",
    "r": 111,
    "g": 78,
    "b": 55
  },
  {
    "hex": "#704214",
    "name": "Sepia",
    "r": 112,
    "g": 66,
    "b": 20
  },
  {
    "hex": "#722F37",
    "name": "Wine",
    "r": 114,
    "g": 47,
    "b": 55
  },
  {
    "hex": "#734222",
    "name": "Mahogany",
    "r": 115,
    "g": 66,
    "b": 34
  },
  {
    "hex": "#79443B",
    "name": "Medium Tuscan Red",
    "r": 121,
    "g": 68,
    "b": 59
  },
  {
    "hex": "#7B3F00",
    "name": "Cinnamon",
    "r": 123,
    "g": 63,
    "b": 0
  },
  {
    "hex": "#7F00FF",
    "name": "Violet Pure",
    "r": 127,
    "g": 0,
    "b": 255
  },
  {
    "hex": "#800020",
    "name": "Burgundy",
    "r": 128,
    "g": 0,
    "b": 32
  },
  {
    "hex": "#804E2D",
    "name": "Raw Sienna",
    "r": 128,
    "g": 78,
    "b": 45
  },
  {
    "hex": "#841B2D",
    "name": "Ruby Red",
    "r": 132,
    "g": 27,
    "b": 45
  },
  {
    "hex": "#87413F",
    "name": "Brandy",
    "r": 135,
    "g": 65,
    "b": 63
  },
  {
    "hex": "#8A3324",
    "name": "Burnt Umber",
    "r": 138,
    "g": 51,
    "b": 36
  },
  {
    "hex": "#8C4736",
    "name": "Copper Red",
    "r": 140,
    "g": 71,
    "b": 54
  },
  {
    "hex": "#900020",
    "name": "Burgundy Deep",
    "r": 144,
    "g": 0,
    "b": 32
  },
  {
    "hex": "#915C83",
    "name": "Antique Fuchsia",
    "r": 145,
    "g": 92,
    "b": 131
  },
  {
    "hex": "#935529",
    "name": "Bronze Muted",
    "r": 147,
    "g": 85,
    "b": 41
  },
  {
    "hex": "#967117",
    "name": "Sand Dune",
    "r": 150,
    "g": 113,
    "b": 23
  },
  {
    "hex": "#98777B",
    "name": "Mountbatten Pink",
    "r": 152,
    "g": 119,
    "b": 123
  },
  {
    "hex": "#9C27B0",
    "name": "Vibrant Purple",
    "r": 156,
    "g": 39,
    "b": 176
  },
  {
    "hex": "#9E2A2B",
    "name": "Venetian Red",
    "r": 158,
    "g": 42,
    "b": 43
  },
  {
    "hex": "#A67B5B",
    "name": "Latte",
    "r": 166,
    "g": 123,
    "b": 91
  },
  {
    "hex": "#AA381E",
    "name": "Chinese Red",
    "r": 170,
    "g": 56,
    "b": 30
  },
  {
    "hex": "#AB47BC",
    "name": "Orchid Vibrant",
    "r": 171,
    "g": 71,
    "b": 188
  },
  {
    "hex": "#B22222",
    "name": "Firebrick",
    "r": 178,
    "g": 34,
    "b": 34
  },
  {
    "hex": "#B33B72",
    "name": "Raspberry Rose",
    "r": 179,
    "g": 59,
    "b": 114
  },
  {
    "hex": "#B5651D",
    "name": "Light Brown",
    "r": 181,
    "g": 101,
    "b": 29
  },
  {
    "hex": "#B7410E",
    "name": "Rust",
    "r": 183,
    "g": 65,
    "b": 14
  },
  {
    "hex": "#BC3F4A",
    "name": "Brick Red",
    "r": 188,
    "g": 63,
    "b": 74
  },
  {
    "hex": "#BE0032",
    "name": "Crimson Flare",
    "r": 190,
    "g": 0,
    "b": 50
  },
  {
    "hex": "#C0392B",
    "name": "Pomegranate",
    "r": 192,
    "g": 57,
    "b": 43
  },
  {
    "hex": "#C2185B",
    "name": "Pink Fuchsia",
    "r": 194,
    "g": 24,
    "b": 91
  },
  {
    "hex": "#C34A47",
    "name": "Flamingo Pink",
    "r": 195,
    "g": 74,
    "b": 71
  },
  {
    "hex": "#C41E3A",
    "name": "Cardinal",
    "r": 196,
    "g": 30,
    "b": 58
  },
  {
    "hex": "#C71585",
    "name": "Medium Violet Red",
    "r": 199,
    "g": 21,
    "b": 133
  },
  {
    "hex": "#CB4154",
    "name": "Brick Crimson",
    "r": 203,
    "g": 65,
    "b": 84
  },
  {
    "hex": "#CF71AF",
    "name": "Lilac Frost",
    "r": 207,
    "g": 113,
    "b": 175
  },
  {
    "hex": "#D35400",
    "name": "Pumpkin Orange",
    "r": 211,
    "g": 84,
    "b": 0
  },
  {
    "hex": "#D81B60",
    "name": "Wild Strawberry",
    "r": 216,
    "g": 27,
    "b": 96
  },
  {
    "hex": "#D9822B",
    "name": "Tiger Lily",
    "r": 217,
    "g": 130,
    "b": 43
  },
  {
    "hex": "#DB7093",
    "name": "Pale Violet Red",
    "r": 219,
    "g": 112,
    "b": 147
  },
  {
    "hex": "#DE5D83",
    "name": "Blush",
    "r": 222,
    "g": 93,
    "b": 131
  },
  {
    "hex": "#DF73FF",
    "name": "Heliotrope",
    "r": 223,
    "g": 115,
    "b": 255
  },
  {
    "hex": "#E0115F",
    "name": "Ruby",
    "r": 224,
    "g": 17,
    "b": 95
  },
  {
    "hex": "#E25822",
    "name": "Flame Orange",
    "r": 226,
    "g": 88,
    "b": 34
  },
  {
    "hex": "#E4717A",
    "name": "Tango Pink",
    "r": 228,
    "g": 113,
    "b": 122
  },
  {
    "hex": "#E67E22",
    "name": "Carrot Orange",
    "r": 230,
    "g": 126,
    "b": 34
  },
  {
    "hex": "#E75480",
    "name": "Dark Pink Rose",
    "r": 231,
    "g": 84,
    "b": 128
  },
  {
    "hex": "#E91E63",
    "name": "Neon Rose",
    "r": 233,
    "g": 30,
    "b": 99
  },
  {
    "hex": "#E9967A",
    "name": "Dark Salmon",
    "r": 233,
    "g": 150,
    "b": 122
  },
  {
    "hex": "#EC407A",
    "name": "Barbie Pink",
    "r": 236,
    "g": 64,
    "b": 122
  },
  {
    "hex": "#EC5800",
    "name": "Persimmon",
    "r": 236,
    "g": 88,
    "b": 0
  },
  {
    "hex": "#EE204D",
    "name": "Red Crayon",
    "r": 238,
    "g": 32,
    "b": 77
  },
  {
    "hex": "#F05E23",
    "name": "Bright Tangerine",
    "r": 240,
    "g": 94,
    "b": 35
  },
  {
    "hex": "#F1A7A0",
    "name": "Cameo Pink",
    "r": 241,
    "g": 167,
    "b": 160
  },
  {
    "hex": "#F28E2B",
    "name": "Apricot Amber",
    "r": 242,
    "g": 142,
    "b": 43
  },
  {
    "hex": "#F4511E",
    "name": "Deep Orange",
    "r": 244,
    "g": 81,
    "b": 30
  },
  {
    "hex": "#F4C430",
    "name": "Saffron",
    "r": 244,
    "g": 196,
    "b": 48
  },
  {
    "hex": "#F65314",
    "name": "Vibrant Persimmon",
    "r": 246,
    "g": 83,
    "b": 20
  },
  {
    "hex": "#F75394",
    "name": "Violet Red",
    "r": 247,
    "g": 83,
    "b": 148
  },
  {
    "hex": "#F7A239",
    "name": "Marigold",
    "r": 247,
    "g": 162,
    "b": 57
  },
  {
    "hex": "#F88379",
    "name": "Coral Pink",
    "r": 248,
    "g": 131,
    "b": 121
  },
  {
    "hex": "#FB607F",
    "name": "Brink Pink",
    "r": 251,
    "g": 96,
    "b": 127
  },
  {
    "hex": "#FC6C85",
    "name": "Watermelon",
    "r": 252,
    "g": 108,
    "b": 133
  },
  {
    "hex": "#FC8EAC",
    "name": "Flamingo",
    "r": 252,
    "g": 142,
    "b": 172
  },
  {
    "hex": "#FD5E53",
    "name": "Sunset Orange",
    "r": 253,
    "g": 94,
    "b": 83
  },
  {
    "hex": "#FE4B03",
    "name": "Neon Orange",
    "r": 254,
    "g": 75,
    "b": 3
  },
  {
    "hex": "#FF3800",
    "name": "Coquelicot",
    "r": 255,
    "g": 56,
    "b": 0
  },
  {
    "hex": "#FF5722",
    "name": "Coral Sun",
    "r": 255,
    "g": 87,
    "b": 34
  },
  {
    "hex": "#FF6F61",
    "name": "Living Coral",
    "r": 255,
    "g": 111,
    "b": 97
  },
  {
    "hex": "#FF7043",
    "name": "Coral Glow",
    "r": 255,
    "g": 112,
    "b": 67
  },
  {
    "hex": "#FF7538",
    "name": "Outrageous Orange",
    "r": 255,
    "g": 117,
    "b": 56
  },
  {
    "hex": "#FF8243",
    "name": "Mango Tango",
    "r": 255,
    "g": 130,
    "b": 67
  },
  {
    "hex": "#FFA812",
    "name": "Dark Tangerine",
    "r": 255,
    "g": 168,
    "b": 18
  },
  {
    "hex": "#FFB347",
    "name": "Pastel Orange",
    "r": 255,
    "g": 179,
    "b": 71
  },
  {
    "hex": "#FFDF00",
    "name": "Golden Yellow",
    "r": 255,
    "g": 223,
    "b": 0
  },
  {
    "hex": "#FFE135",
    "name": "Banana Yellow",
    "r": 255,
    "g": 225,
    "b": 53
  },
  {
    "hex": "#FFF44F",
    "name": "Lemon Yellow",
    "r": 255,
    "g": 244,
    "b": 79
  },
  {
    "hex": "#FFFF66",
    "name": "Laser Lemon",
    "r": 255,
    "g": 255,
    "b": 102
  },
  {
    "hex": "#00FFEF",
    "name": "Turquoise Glow",
    "r": 0,
    "g": 255,
    "b": 239
  },
  {
    "hex": "#00E676",
    "name": "Spring Light",
    "r": 0,
    "g": 230,
    "b": 118
  },
  {
    "hex": "#1DE9B6",
    "name": "Teal Accent",
    "r": 29,
    "g": 233,
    "b": 182
  },
  {
    "hex": "#76FF03",
    "name": "Bright Lime",
    "r": 118,
    "g": 255,
    "b": 3
  },
  {
    "hex": "#64DD17",
    "name": "Lime Accent",
    "r": 100,
    "g": 221,
    "b": 23
  },
  {
    "hex": "#AEEA00",
    "name": "Chartreuse Glow",
    "r": 174,
    "g": 234,
    "b": 0
  },
  {
    "hex": "#FFD600",
    "name": "Yellow Accent",
    "r": 255,
    "g": 214,
    "b": 0
  },
  {
    "hex": "#FFAB00",
    "name": "Amber Accent",
    "r": 255,
    "g": 171,
    "b": 0
  },
  {
    "hex": "#FF6D00",
    "name": "Orange Accent",
    "r": 255,
    "g": 109,
    "b": 0
  },
  {
    "hex": "#FF3D00",
    "name": "Red Orange Accent",
    "r": 255,
    "g": 61,
    "b": 0
  },
  {
    "hex": "#D50000",
    "name": "Red Accent",
    "r": 213,
    "g": 0,
    "b": 0
  },
  {
    "hex": "#C51162",
    "name": "Pink Accent",
    "r": 197,
    "g": 17,
    "b": 98
  },
  {
    "hex": "#AA00FF",
    "name": "Purple Accent",
    "r": 170,
    "g": 0,
    "b": 255
  },
  {
    "hex": "#6200EA",
    "name": "Deep Purple Accent",
    "r": 98,
    "g": 0,
    "b": 234
  },
  {
    "hex": "#304FFE",
    "name": "Indigo Accent",
    "r": 48,
    "g": 79,
    "b": 254
  },
  {
    "hex": "#00B0FF",
    "name": "Light Blue Accent",
    "r": 0,
    "g": 176,
    "b": 255
  },
  {
    "hex": "#00E5FF",
    "name": "Cyan Accent",
    "r": 0,
    "g": 229,
    "b": 255
  }
];

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
    str: `hsl(${h}, ${sPct}%, ${lPct}%)`,
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
    str: `hsv(${h}, ${sPct}%, ${vPct}%)`,
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
    str: `cmyk(${c}%, ${m}%, ${y}%, ${kPct}%)`,
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
      label: `+${Math.round(factor * 100)}%`,
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
      label: `-${Math.round(factor * 100)}%`,
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
    const key = `${qr},${qg},${qb}`;

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
