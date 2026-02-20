// ── Profile ───────────────────────────────────────────────
export const profile = {
  name: 'Martin Mallet',
  initials: 'MM',
  location: 'Schleswig, SH',
  club: 'RV Schleswig e.V.',
  stravaProfile: 'https://www.strava.com',
  since: '2019',
}

// ── YTD Stats (Jahr 2026) ─────────────────────────────────
export const ytdStats = {
  km: 1843,
  rides: 47,
  hoursTotal: 68.5,
  elevationM: 12400,
  longestRideKm: 178,
  avgSpeedKmh: 26.9,
}

// ── Monthly km (Jan – Dez 2026, aktuell Feb) ─────────────
export const monthlyKm = [
  { month: 'Jan', km: 612 },
  { month: 'Feb', km: 1231 },
  { month: 'Mär', km: 0 },
  { month: 'Apr', km: 0 },
  { month: 'Mai', km: 0 },
  { month: 'Jun', km: 0 },
  { month: 'Jul', km: 0 },
  { month: 'Aug', km: 0 },
  { month: 'Sep', km: 0 },
  { month: 'Okt', km: 0 },
  { month: 'Nov', km: 0 },
  { month: 'Dez', km: 0 },
]

// ── Recent Activities ─────────────────────────────────────
export interface Activity {
  id: number
  date: string
  title: string
  type: 'Rennrad' | 'Gravel' | 'MTB' | 'Indoors'
  km: number
  durationMin: number
  elevationM: number
  avgSpeedKmh: number
  avgHr?: number
  komootUrl?: string
  description?: string
  sufferScore?: number
}

export const recentActivities: Activity[] = [
  {
    id: 1,
    date: '2026-02-18',
    title: 'Schlei-Runde — Morgensonne',
    type: 'Rennrad',
    km: 92.4,
    durationMin: 204,
    elevationM: 680,
    avgSpeedKmh: 27.2,
    avgHr: 148,
    description: 'Traumhafte Ausfahrt entlang der Schlei bis Kappeln und zurück. Erste Sonnenstrahlen des Jahres.',
    sufferScore: 87,
    komootUrl: 'https://www.komoot.com',
  },
  {
    id: 2,
    date: '2026-02-15',
    title: 'Wiedaú Waldwege (Gravel)',
    type: 'Gravel',
    km: 58.1,
    durationMin: 163,
    elevationM: 420,
    avgSpeedKmh: 21.4,
    avgHr: 141,
    description: 'Erkundung der Forstwege nördlich von Flensburg. Matschig aber spaßig.',
    sufferScore: 68,
  },
  {
    id: 3,
    date: '2026-02-12',
    title: 'Intervall-Training',
    type: 'Indoors',
    km: 45.0,
    durationMin: 75,
    elevationM: 0,
    avgSpeedKmh: 36.0,
    avgHr: 162,
    description: '3×12 min SST auf dem Trainer. Watts steigen langsam.',
    sufferScore: 114,
  },
  {
    id: 4,
    date: '2026-02-08',
    title: 'Flensburg & Förde',
    type: 'Rennrad',
    km: 178.3,
    durationMin: 395,
    elevationM: 1240,
    avgSpeedKmh: 27.1,
    avgHr: 146,
    description: 'Längste Ausfahrt der Saison bisher. Über die dänische Grenze und zurück entlang der Förde.',
    sufferScore: 203,
    komootUrl: 'https://www.komoot.com',
  },
  {
    id: 5,
    date: '2026-02-04',
    title: 'Angeln Hügel',
    type: 'Rennrad',
    km: 74.6,
    durationMin: 172,
    elevationM: 820,
    avgSpeedKmh: 26.0,
    avgHr: 152,
    description: 'Durch das Hügelland Angeln — kurze Anstiege, tolle Aussichten.',
    sufferScore: 96,
  },
  {
    id: 6,
    date: '2026-01-28',
    title: 'Einsam auf der Geest',
    type: 'Gravel',
    km: 63.8,
    durationMin: 185,
    elevationM: 280,
    avgSpeedKmh: 20.7,
    avgHr: 138,
    description: 'Flache Geest im Winter. Ruhig, windig, wunderschön.',
    sufferScore: 55,
  },
]

// ── Bike Garage ───────────────────────────────────────────
export interface Bike {
  id: string
  brand: string
  model: string
  year: number
  type: 'Rennrad' | 'Gravel' | 'Indoors'
  colorHex: string
  totalKm: number
  weight: string
  groupset: string
  tires: string
  notes?: string
  komponentenStatus: 'OK' | 'Wartung fällig' | 'Neu'
}

export const bikeGarage: Bike[] = [
  {
    id: 'road-1',
    brand: 'Trek',
    model: 'Domane SL 6',
    year: 2022,
    type: 'Rennrad',
    colorHex: '#c0392b',
    totalKm: 14820,
    weight: '8.1 kg',
    groupset: 'Shimano 105 Di2',
    tires: 'Continental GP5000 32c',
    notes: 'Hauptbike für Touren & Rennen',
    komponentenStatus: 'Wartung fällig',
  },
  {
    id: 'gravel-1',
    brand: 'Specialized',
    model: 'Diverge Comp',
    year: 2023,
    type: 'Gravel',
    colorHex: '#8e44ad',
    totalKm: 6340,
    weight: '9.3 kg',
    groupset: 'SRAM Rival AXS',
    tires: 'Pathfinder Pro 42c',
    notes: 'Schotter, Wald & Abenteuer',
    komponentenStatus: 'OK',
  },
  {
    id: 'indoor-1',
    brand: 'Wahoo',
    model: 'KICKR Core',
    year: 2021,
    type: 'Indoors',
    colorHex: '#2980b9',
    totalKm: 8900,
    weight: '—',
    groupset: '—',
    tires: '—',
    notes: 'Wahoo KICKR Core + Cervélo Caledonia',
    komponentenStatus: 'OK',
  },
]

// ── Persönliche Lieblingsstrecken ─────────────────────────
export interface FavoriteRoute {
  title: string
  km: number
  elevationM: number
  type: 'Rennrad' | 'Gravel'
  description: string
  komootUrl: string
  colorHex: string
}

export const favoriteRoutes: FavoriteRoute[] = [
  {
    title: 'Klassiker: Rund um die Schlei',
    km: 105,
    elevationM: 720,
    type: 'Rennrad',
    description: 'Die schönste Runde in Angeln — von Schleswig quer durch Kappeln und zurück.',
    komootUrl: 'https://www.komoot.com/de-de/tour/2165067343',
    colorHex: '#e8491d',
  },
  {
    title: 'Flensburger Förde & Dänemark',
    km: 130,
    elevationM: 980,
    type: 'Rennrad',
    description: 'Über die Grenze nach Sønderborg und entlang der Förde zurück.',
    komootUrl: 'https://www.komoot.com',
    colorHex: '#3d7dd6',
  },
  {
    title: 'Gravel Angeln',
    km: 82,
    elevationM: 620,
    type: 'Gravel',
    description: 'Schotterwege durch das Hügelland Angeln — der Viking Bike Challenge Gravel-Track.',
    komootUrl: 'https://www.komoot.com/de-de/tour/2263487719',
    colorHex: '#9b59b6',
  },
]

// ── Saisonziele ────────────────────────────────────────────
export const goals = [
  { label: 'Jahres-km', target: 8000, current: 1843, unit: 'km' },
  { label: 'Viking Bike Challenge', target: 1, current: 0, unit: 'Event' },
  { label: 'NordCup Brevet', target: 2, current: 0, unit: 'Brevets' },
  { label: 'Längste Fahrt', target: 300, current: 178, unit: 'km' },
]
