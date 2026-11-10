// Datos simulados compartidos para el panel de administración Skipper View.
// Mantenido seguro para navegador para que cualquier ruta pueda importarlo.

export const revenueData = [
  { month: "Ene", revenue: 4200, orders: 240 },
  { month: "Feb", revenue: 5100, orders: 290 },
  { month: "Mar", revenue: 4800, orders: 270 },
  { month: "Abr", revenue: 6300, orders: 340 },
  { month: "May", revenue: 7200, orders: 410 },
  { month: "Jun", revenue: 6800, orders: 380 },
  { month: "Jul", revenue: 8100, orders: 460 },
  { month: "Ago", revenue: 9200, orders: 520 },
  { month: "Sep", revenue: 8700, orders: 490 },
  { month: "Oct", revenue: 10400, orders: 580 },
  { month: "Nov", revenue: 11800, orders: 650 },
  { month: "Dic", revenue: 13200, orders: 720 },
];

export const trafficData = [
  { day: "Lun", direct: 320, organic: 480, referral: 120 },
  { day: "Mar", direct: 410, organic: 520, referral: 150 },
  { day: "Mié", direct: 380, organic: 610, referral: 180 },
  { day: "Jue", direct: 460, organic: 580, referral: 160 },
  { day: "Vie", direct: 520, organic: 690, referral: 210 },
  { day: "Sáb", direct: 610, organic: 740, referral: 240 },
  { day: "Dom", direct: 540, organic: 660, referral: 190 },
];

export const categoryShare = [
  { name: "Electrónica", value: 38, color: "var(--color-chart-1)" },
  { name: "Ropa", value: 27, color: "var(--color-chart-2)" },
  { name: "Hogar", value: 19, color: "var(--color-chart-3)" },
  { name: "Belleza", value: 16, color: "var(--color-chart-5)" },
];

export type OrderStatus = "Pagado" | "Pendiente" | "Reembolsado" | "Fallido";

export interface Order {
  id: string;
  customer: string;
  email: string;
  phone?: string;
  date: string;
  amount: number;
  status: OrderStatus;
  items: number;
  /** Nombre del curso / oportunidad */
  course?: string;
}

export const orders: Order[] = [
  {
    id: "#ORD-7841",
    customer: "Mara Velez",
    email: "mara@vel.io",
    date: "2026-09-21",
    amount: 248.0,
    status: "Pagado",
    items: 3,
  },
  {
    id: "#ORD-7840",
    customer: "Theo Park",
    email: "theo@park.dev",
    date: "2026-09-21",
    amount: 89.5,
    status: "Pendiente",
    items: 1,
  },
  {
    id: "#ORD-7839",
    customer: "Lina Sato",
    email: "lina@sato.co",
    date: "2026-09-20",
    amount: 1240.0,
    status: "Pagado",
    items: 7,
  },
  {
    id: "#ORD-7838",
    customer: "Owen Frye",
    email: "owen@frye.me",
    date: "2026-09-20",
    amount: 56.75,
    status: "Reembolsado",
    items: 2,
  },
  {
    id: "#ORD-7837",
    customer: "Iris Cole",
    email: "iris@cole.io",
    date: "2026-09-19",
    amount: 399.0,
    status: "Pagado",
    items: 4,
  },
  {
    id: "#ORD-7836",
    customer: "Nico Reyes",
    email: "nico@reyes.dev",
    date: "2026-09-19",
    amount: 72.2,
    status: "Fallido",
    items: 1,
  },
  {
    id: "#ORD-7835",
    customer: "Hana Ito",
    email: "hana@ito.co",
    date: "2026-09-18",
    amount: 615.0,
    status: "Pagado",
    items: 5,
  },
  {
    id: "#ORD-7834",
    customer: "Leo Marsh",
    email: "leo@marsh.me",
    date: "2026-09-18",
    amount: 134.0,
    status: "Pendiente",
    items: 2,
  },
  {
    id: "#ORD-7833",
    customer: "Zoe Quinn",
    email: "zoe@quinn.io",
    date: "2026-09-17",
    amount: 880.0,
    status: "Pagado",
    items: 6,
  },
  {
    id: "#ORD-7832",
    customer: "Max Dunn",
    email: "max@dunn.dev",
    date: "2026-09-17",
    amount: 45.0,
    status: "Reembolsado",
    items: 1,
  },
  {
    id: "#ORD-7831",
    customer: "Ada Lin",
    email: "ada@lin.co",
    date: "2026-09-16",
    amount: 512.0,
    status: "Pagado",
    items: 3,
  },
  {
    id: "#ORD-7830",
    customer: "Kai Brooks",
    email: "kai@brooks.me",
    date: "2026-09-16",
    amount: 198.5,
    status: "Pendiente",
    items: 2,
  },
];

export type CourseSchedule = "Mañana" | "Tarde" | "Noche";

export interface Customer {
  id: string;
  /** Nombre completo */
  name: string;
  email: string;
  /** Teléfono */
  phone: string;
  location: string;
  orders: number;
  spent: number;
  since: string;
  tier: "Bronce" | "Plata" | "Oro" | "Platino";
  /** Asesor propietario del lead */
  owner: string;
  /** Cuánto abonó (pago parcial) */
  deposit: number;
  /** Pago completo o abono */
  paymentStatus: "Pago completo" | "Abono";
  /** Nombre del curso */
  course: string;
  /** Modalidad del curso (Virtual, Presencial, etc.) */
  modality: string;
  /** Horario del curso */
  schedule: CourseSchedule;
  /** Fecha de venta (ISO yyyy-mm-dd) */
  saleDate: string;
  /** Nombre de la campaña */
  campaign: string;
}

export const customers: Customer[] = [
  {
    id: "C-1042",
    name: "Mara Velez",
    email: "mara@vel.io",
    phone: "+34 612 345 678",
    location: "Lisboa, PT",
    orders: 42,
    spent: 9840,
    since: "2023-03-12",
    tier: "Platino",
    owner: "Valeria Núñez",
    deposit: 9840,
    paymentStatus: "Pago completo",
    course: "Marketing Digital Avanzado",
    modality: "",
    schedule: "Tarde",
    saleDate: "2026-09-15",
    campaign: "Otoño 2026 — Meta Ads",
  },
  {
    id: "C-1041",
    name: "Theo Park",
    email: "theo@park.dev",
    phone: "+34 623 987 411",
    location: "Seúl, KR",
    orders: 18,
    spent: 2310,
    since: "2024-01-08",
    tier: "Plata",
    owner: "Diego Salas",
    deposit: 800,
    paymentStatus: "Abono",
    course: "Diseño UX/UI",
    modality: "",
    schedule: "Noche",
    saleDate: "2026-09-12",
    campaign: "Otoño 2026 — Google Ads",
  },
  {
    id: "C-1040",
    name: "Lina Sato",
    email: "lina@sato.co",
    phone: "+34 644 102 933",
    location: "Osaka, JP",
    orders: 67,
    spent: 18200,
    since: "2022-07-22",
    tier: "Platino",
    owner: "Lucía Romero",
    deposit: 18200,
    paymentStatus: "Pago completo",
    course: "Desarrollo Full Stack",
    modality: "",
    schedule: "Mañana",
    saleDate: "2026-09-18",
    campaign: "Otoño 2026 — Webinario",
  },
  {
    id: "C-1039",
    name: "Owen Frye",
    email: "owen@frye.me",
    phone: "+34 655 778 120",
    location: "Austin, US",
    orders: 9,
    spent: 540,
    since: "2025-02-14",
    tier: "Bronce",
    owner: "Mateo Herrera",
    deposit: 150,
    paymentStatus: "Abono",
    course: "Inglés Conversacional",
    modality: "",
    schedule: "Tarde",
    saleDate: "2026-09-08",
    campaign: "Verano 2026 — Referidos",
  },
  {
    id: "C-1038",
    name: "Iris Cole",
    email: "iris@cole.io",
    phone: "+34 666 410 552",
    location: "Dublín, IE",
    orders: 31,
    spent: 6120,
    since: "2023-11-03",
    tier: "Oro",
    owner: "Sofía Castro",
    deposit: 6120,
    paymentStatus: "Pago completo",
    course: "Contabilidad para Pymes",
    modality: "",
    schedule: "Mañana",
    saleDate: "2026-09-14",
    campaign: "Otoño 2026 — Meta Ads",
  },
  {
    id: "C-1037",
    name: "Nico Reyes",
    email: "nico@reyes.dev",
    phone: "+34 677 231 884",
    location: "Madrid, ES",
    orders: 22,
    spent: 3480,
    since: "2024-05-19",
    tier: "Plata",
    owner: "Andrés Vega",
    deposit: 1200,
    paymentStatus: "Abono",
    course: "Fotografía Profesional",
    modality: "",
    schedule: "Noche",
    saleDate: "2026-09-10",
    campaign: "Otoño 2026 — Instagram",
  },
  {
    id: "C-1036",
    name: "Hana Ito",
    email: "hana@ito.co",
    phone: "+34 688 902 317",
    location: "Tokio, JP",
    orders: 54,
    spent: 12950,
    since: "2022-09-30",
    tier: "Platino",
    owner: "Valeria Núñez",
    deposit: 12950,
    paymentStatus: "Pago completo",
    course: "Marketing Digital Avanzado",
    modality: "",
    schedule: "Tarde",
    saleDate: "2026-09-17",
    campaign: "Otoño 2026 — Webinario",
  },
  {
    id: "C-1035",
    name: "Leo Marsh",
    email: "leo@marsh.me",
    phone: "+34 699 540 761",
    location: "Mánchester, UK",
    orders: 14,
    spent: 1670,
    since: "2024-08-11",
    tier: "Plata",
    owner: "Diego Salas",
    deposit: 500,
    paymentStatus: "Abono",
    course: "Diseño UX/UI",
    modality: "",
    schedule: "Mañana",
    saleDate: "2026-09-09",
    campaign: "Verano 2026 — Google Ads",
  },
  {
    id: "C-1034",
    name: "Zoe Quinn",
    email: "zoe@quinn.io",
    phone: "+34 610 665 204",
    location: "Toronto, CA",
    orders: 38,
    spent: 7420,
    since: "2023-06-25",
    tier: "Oro",
    owner: "Lucía Romero",
    deposit: 7420,
    paymentStatus: "Pago completo",
    course: "Desarrollo Full Stack",
    modality: "",
    schedule: "Noche",
    saleDate: "2026-09-16",
    campaign: "Otoño 2026 — Meta Ads",
  },
  {
    id: "C-1033",
    name: "Max Dunn",
    email: "max@dunn.dev",
    phone: "+34 621 318 490",
    location: "Berlín, DE",
    orders: 6,
    spent: 320,
    since: "2025-04-02",
    tier: "Bronce",
    owner: "Mateo Herrera",
    deposit: 100,
    paymentStatus: "Abono",
    course: "Inglés Conversacional",
    modality: "",
    schedule: "Tarde",
    saleDate: "2026-09-05",
    campaign: "Verano 2026 — Referidos",
  },
];

export const hourlyVisits = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  visits: Math.round(80 + 120 * Math.sin((h / 24) * Math.PI * 2 + 1) + Math.random() * 40),
}));

export const funnelData = [
  { stage: "Visitas", value: 12400, color: "var(--color-chart-1)" },
  { stage: "Registros", value: 5200, color: "var(--color-chart-2)" },
  { stage: "Pruebas", value: 3100, color: "var(--color-chart-3)" },
  { stage: "Pagados", value: 1480, color: "var(--color-chart-5)" },
];
