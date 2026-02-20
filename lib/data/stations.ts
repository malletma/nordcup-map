export interface Station {
  name: string
  km: number
  lat: number
  lng: number
  location: string
  offerings: string[]
  forRoutes: string[]
}

export const stations: Station[] = [
  {
    name: 'Start / Ziel — Dannewerkschule',
    km: 0,
    lat: 54.523263, lng: 9.538306,
    location: 'Erikstraße 50, 24837 Schleswig',
    offerings: ['Anmeldung', 'WC', 'Duschen', 'Garderobe', 'Erfrischungen am Ziel'],
    forRoutes: ['marathon', 'gravel', 'rtf152', 'rtf112', 'rtf80', 'rtf49'],
  },
  {
    name: 'VP 1 — Südwest',
    km: 42,
    lat: 54.475000, lng: 9.420000,
    location: 'Nähe Owschlag / Rendsburg',
    offerings: ['Wasser', 'Iso-Getränke', 'Bananen', 'Riegel', 'Kuchen'],
    forRoutes: ['marathon'],
  },
  {
    name: 'VP 2 — Süd (große Runde)',
    km: 82,
    lat: 54.390000, lng: 9.530000,
    location: 'Raum Eckernförde-Nord',
    offerings: ['Wasser', 'Cola', 'Brötchen', 'Bananen', 'Riegel', 'WC'],
    forRoutes: ['marathon', 'gravel'],
  },
  {
    name: 'VP 3 — Ost (Schlei-Südufer)',
    km: 120,
    lat: 54.436000, lng: 9.712000,
    location: 'Raum Damp / Schwansen',
    offerings: ['Wasser', 'Iso-Getränke', 'Kuchen', 'Obst', 'Riegel'],
    forRoutes: ['marathon', 'rtf152', 'rtf112'],
  },
  {
    name: 'VP 4 — Nordost (Schlei-Nordufer)',
    km: 160,
    lat: 54.560000, lng: 9.700000,
    location: 'Raum Süderbrarup / Kappeln',
    offerings: ['Wasser', 'Cola', 'Haferbrei', 'Brötchen', 'Bananen', 'WC'],
    forRoutes: ['marathon', 'gravel', 'rtf152', 'rtf112', 'rtf80'],
  },
  {
    name: 'VP 5 — Nordwest (Rückkehr)',
    km: 190,
    lat: 54.595000, lng: 9.555000,
    location: 'Raum Tarp / Idstedt',
    offerings: ['Wasser', 'Iso-Getränke', 'Riegel', 'Bananen'],
    forRoutes: ['marathon'],
  },
]
