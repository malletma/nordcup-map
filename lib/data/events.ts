export interface Event {
  id: number
  name: string
  date: string
  dateSort: string
  club: string
  link: string
  lat: number
  lon: number
  location: string
  serie: 'NordCup' | 'Brevet' | 'RTF' | 'Jedermann'
  typ: string
  region: string
  distances: string[]
  komoot?: string
  hasTrack?: boolean
}

export const serieColors: Record<string, string> = {
  NordCup: '#3d5875',
  Brevet: '#6b4c9a',
  RTF: '#2a7d4f',
  Jedermann: '#b8860b',
}

export const serieColorKeys: Record<string, string> = {
  NordCup: 'nordcup',
  Brevet: 'brevet',
  RTF: 'rtf',
  Jedermann: 'jedermann',
}

export const events: Event[] = [
  // ── NordCup Radmarathon ──
  {
    id: 1, name: 'Ostholstein Extrem', date: '26.04.2026', dateSort: '2026-04-26',
    club: 'RST Lübeck e.V.', link: 'https://rst-luebeck.de/',
    lat: 53.8655, lon: 10.6866, location: 'Lübeck',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Schleswig-Holstein',
    distances: ['112 km', '155 km', '205 km'],
  },
  {
    id: 2, name: 'Holsteiner Pfeil XXL', date: '10.05.2026', dateSort: '2026-05-10',
    club: 'RST Malente e.V.', link: 'http://www.radsport-team-malente.de/',
    lat: 54.1680, lon: 10.5580, location: 'Bad Malente',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Schleswig-Holstein',
    distances: ['116 km', '155 km', '207 km'],
  },
  {
    id: 3, name: 'Nordsee Radmarathon', date: '17.05.2026', dateSort: '2026-05-17',
    club: 'RSV Husum', link: 'https://www.rsv-husum.de/',
    lat: 54.4764, lon: 9.0519, location: 'Husum',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Schleswig-Holstein',
    distances: ['110 km', '156 km', '210 km'],
  },
  {
    id: 4, name: 'Viking Bike Challenge', date: '07.06.2026', dateSort: '2026-06-07',
    club: 'RV Schleswig e.V.', link: 'https://rv-schleswig.de/',
    lat: 54.5153, lon: 9.5707, location: 'Schleswig',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Schleswig-Holstein',
    distances: ['115 km', '155 km', '204 km'],
    komoot: 'https://www.komoot.com/de-de/tour/2165067343',
    hasTrack: true,
  },
  {
    id: 5, name: 'Bike Challenge Mittelholstein', date: '21.06.2026', dateSort: '2026-06-21',
    club: 'RSG Mittelpunkt Nortorf e.V.', link: 'https://www.nortorf.bike/',
    lat: 54.1658, lon: 9.8545, location: 'Nortorf',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Schleswig-Holstein',
    distances: ['112 km', '157 km', '210 km'],
  },
  {
    id: 6, name: 'Sparkasse Mittelholstein AG Kanalfahrt', date: '05.07.2026', dateSort: '2026-07-05',
    club: 'RBC Rendsburg e.V.', link: 'https://www.rbc-1894.de/',
    lat: 54.3001, lon: 9.6643, location: 'Rendsburg',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Schleswig-Holstein',
    distances: ['110 km', '152 km', '206 km'],
  },
  {
    id: 7, name: 'Rund um den Kattenberg', date: '02.08.2026', dateSort: '2026-08-02',
    club: 'RSC Kattenberg e.V.', link: 'https://www.rsc-kattenberg.de/',
    lat: 53.7840, lon: 9.8750, location: 'Buchholz i.d. Nordheide',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Niedersachsen',
    distances: ['112 km', '155 km', '203 km'],
  },
  {
    id: 8, name: 'Geest-Radmarathon', date: '16.08.2026', dateSort: '2026-08-16',
    club: 'VfL Stade — Radsport', link: 'https://www.vfl-stade.de/abteilungen/radsport',
    lat: 53.5976, lon: 9.4764, location: 'Stade',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Niedersachsen',
    distances: ['120 km', '160 km', '210 km'],
  },
  {
    id: 9, name: 'Kaperfahrt & Marathon to Hell', date: '06.09.2026', dateSort: '2026-09-06',
    club: 'FC St. Pauli Radsport', link: 'https://fcstpauli-radsport.de/',
    lat: 53.5511, lon: 9.9937, location: 'Hamburg',
    serie: 'NordCup', typ: 'Radmarathon', region: 'Hamburg',
    distances: ['115 km', '165 km', '215 km'],
  },
  // ── Brevets ──
  {
    id: 10, name: 'Brevet 200 — Ostseewind', date: '15.03.2026', dateSort: '2026-03-15',
    club: 'ARA Hamburg', link: 'https://www.audax-randonneure.de/',
    lat: 53.5753, lon: 10.0153, location: 'Hamburg',
    serie: 'Brevet', typ: 'Brevet', region: 'Hamburg',
    distances: ['200 km'],
  },
  {
    id: 11, name: 'Brevet 300 — Lüneburger Heide', date: '18.04.2026', dateSort: '2026-04-18',
    club: 'ARA Hamburg', link: 'https://www.audax-randonneure.de/',
    lat: 53.2485, lon: 10.4128, location: 'Lüneburg',
    serie: 'Brevet', typ: 'Brevet', region: 'Niedersachsen',
    distances: ['300 km'],
  },
  {
    id: 12, name: 'Brevet 400 — Nordsee-Ostsee', date: '16.05.2026', dateSort: '2026-05-16',
    club: 'ARA Nord', link: 'https://www.audax-randonneure.de/',
    lat: 54.3233, lon: 10.1228, location: 'Kiel',
    serie: 'Brevet', typ: 'Brevet', region: 'Schleswig-Holstein',
    distances: ['400 km'],
  },
  {
    id: 13, name: 'Brevet 600 — Dänemark-Runde', date: '13.06.2026', dateSort: '2026-06-13',
    club: 'ARA Nord', link: 'https://www.audax-randonneure.de/',
    lat: 54.7937, lon: 9.4350, location: 'Flensburg',
    serie: 'Brevet', typ: 'Brevet', region: 'Schleswig-Holstein',
    distances: ['600 km'],
  },
  // ── RTF ──
  {
    id: 14, name: 'Frühjahrs-RTF Neumünster', date: '29.03.2026', dateSort: '2026-03-29',
    club: 'RC Neumünster', link: '',
    lat: 54.0712, lon: 9.9852, location: 'Neumünster',
    serie: 'RTF', typ: 'RTF', region: 'Schleswig-Holstein',
    distances: ['45 km', '75 km', '115 km'],
  },
  {
    id: 15, name: 'RTF Rund um den Sachsenwald', date: '19.04.2026', dateSort: '2026-04-19',
    club: 'RSG Sachsenwald', link: '',
    lat: 53.5344, lon: 10.3362, location: 'Reinbek',
    serie: 'RTF', typ: 'RTF', region: 'Schleswig-Holstein',
    distances: ['42 km', '72 km', '112 km'],
  },
  {
    id: 16, name: 'RTF Altes Land', date: '03.05.2026', dateSort: '2026-05-03',
    club: 'RV Jork', link: '',
    lat: 53.5322, lon: 9.6778, location: 'Jork',
    serie: 'RTF', typ: 'RTF', region: 'Niedersachsen',
    distances: ['48 km', '78 km', '120 km'],
  },
  {
    id: 17, name: 'RTF Fehmarn-Tour', date: '07.06.2026', dateSort: '2026-06-07',
    club: 'RSV Fehmarn', link: '',
    lat: 54.4376, lon: 11.1953, location: 'Burg auf Fehmarn',
    serie: 'RTF', typ: 'RTF', region: 'Schleswig-Holstein',
    distances: ['50 km', '80 km', '110 km'],
  },
  {
    id: 18, name: 'RTF Mecklenburg Seen', date: '28.06.2026', dateSort: '2026-06-28',
    club: 'RSV Schwerin', link: '',
    lat: 53.6355, lon: 11.4015, location: 'Schwerin',
    serie: 'RTF', typ: 'RTF', region: 'Mecklenburg-Vorpommern',
    distances: ['55 km', '90 km', '130 km'],
  },
  // ── Jedermann-Rennen ──
  {
    id: 19, name: 'Hamburger Cyclassics — Jedermann', date: '16.08.2026', dateSort: '2026-08-16',
    club: 'Ironman Hamburg GmbH', link: 'https://www.cyclassics-hamburg.de/',
    lat: 53.5563, lon: 9.9867, location: 'Hamburg',
    serie: 'Jedermann', typ: 'Jedermann-Rennen', region: 'Hamburg',
    distances: ['60 km', '100 km', '160 km'],
  },
  {
    id: 20, name: 'Ostseeman — Jedermann Radrennen', date: '02.08.2026', dateSort: '2026-08-02',
    club: 'SC Mühlbrook', link: 'https://www.ostseeman.de/',
    lat: 54.2375, lon: 10.0325, location: 'Bordesholm',
    serie: 'Jedermann', typ: 'Jedermann-Rennen', region: 'Schleswig-Holstein',
    distances: ['90 km'],
  },
  {
    id: 21, name: 'Rund um den Henstedter Berg', date: '30.08.2026', dateSort: '2026-08-30',
    club: 'RSG Henstedt-Ulzburg', link: '',
    lat: 53.7970, lon: 9.9805, location: 'Henstedt-Ulzburg',
    serie: 'Jedermann', typ: 'Jedermann-Rennen', region: 'Schleswig-Holstein',
    distances: ['55 km', '85 km'],
  },
  {
    id: 22, name: 'Rostocker Jedermann-Radrennen', date: '20.09.2026', dateSort: '2026-09-20',
    club: 'PSV Rostock', link: '',
    lat: 54.0887, lon: 12.1407, location: 'Rostock',
    serie: 'Jedermann', typ: 'Jedermann-Rennen', region: 'Mecklenburg-Vorpommern',
    distances: ['50 km', '100 km'],
  },
]

export const vikingTrack: [number, number][] = [
  [54.523263, 9.538306], [54.523525, 9.536006], [54.524232, 9.535152],
  [54.524226, 9.533329], [54.523967, 9.530577], [54.52396, 9.527923],
  [54.522445, 9.527418], [54.520997, 9.525926], [54.519557, 9.523176],
  [54.51864, 9.521142], [54.518314, 9.519428], [54.516, 9.513],
  [54.510, 9.503], [54.504, 9.495], [54.498, 9.489],
  [54.493, 9.482], [54.488249, 9.477307], [54.482, 9.452],
  [54.478, 9.435], [54.475399, 9.418024], [54.470358, 9.418389],
  [54.472654, 9.47316], [54.465, 9.496], [54.452, 9.512],
  [54.439072, 9.52037], [54.449, 9.545], [54.462301, 9.56099],
  [54.452243, 9.572758], [54.46082, 9.593821], [54.464363, 9.670621],
  [54.471, 9.695], [54.480822, 9.711607], [54.470, 9.735],
  [54.4546, 9.753642], [54.445843, 9.767294], [54.425, 9.773],
  [54.405898, 9.777802], [54.385, 9.798], [54.367239, 9.819343],
  [54.366315, 9.820111], [54.370, 9.780], [54.373, 9.738],
  [54.376, 9.700], [54.379112, 9.673691], [54.389, 9.665],
  [54.398752, 9.65562], [54.40041, 9.64188], [54.410, 9.636],
  [54.421128, 9.629637], [54.430, 9.660], [54.436197, 9.711652],
  [54.437276, 9.712686], [54.448, 9.690], [54.45792, 9.669567],
  [54.45994, 9.66634], [54.470, 9.680], [54.48426, 9.70483],
  [54.48269, 9.744662], [54.497, 9.735], [54.510, 9.726],
  [54.517445, 9.723166], [54.521306, 9.747395], [54.524154, 9.767027],
  [54.52992, 9.769021], [54.5374, 9.78021], [54.541165, 9.793956],
  [54.543122, 9.797718], [54.542697, 9.804159], [54.544778, 9.824105],
  [54.552771, 9.829806], [54.557272, 9.832339], [54.56305, 9.837853],
  [54.567259, 9.836492], [54.574652, 9.847766], [54.58244, 9.853052],
  [54.59056, 9.859127], [54.587254, 9.910087], [54.592068, 9.911152],
  [54.598089, 9.912021], [54.60273, 9.916906], [54.607275, 9.91607],
  [54.611254, 9.919022], [54.62109, 9.933229], [54.623566, 9.942247],
  [54.640315, 9.950206], [54.64877, 9.951647], [54.649463, 9.923146],
  [54.637423, 9.919616], [54.631131, 9.896506], [54.620, 9.870],
  [54.606673, 9.848513], [54.604134, 9.836477], [54.595, 9.822],
  [54.589025, 9.812224], [54.58279, 9.784724], [54.587831, 9.781365],
  [54.580416, 9.747411], [54.567577, 9.739084], [54.57716, 9.68986],
  [54.590, 9.698], [54.60326, 9.701696], [54.608248, 9.697563],
  [54.613125, 9.701704], [54.610, 9.660], [54.607285, 9.610631],
  [54.604292, 9.582511], [54.610134, 9.552055], [54.595, 9.553],
  [54.576901, 9.555942], [54.585, 9.525], [54.595, 9.500],
  [54.603465, 9.48416], [54.591996, 9.493555], [54.574411, 9.494219],
  [54.555, 9.496], [54.537808, 9.497377], [54.530, 9.510],
  [54.524122, 9.526892], [54.523525, 9.536006], [54.523263, 9.538306],
]
