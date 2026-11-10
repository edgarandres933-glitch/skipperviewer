// Datos simulados de leads para el panel Skipper View.
// Browser-safe para que cualquier ruta pueda importarlo.

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  status: "Nuevo" | "Contactado" | "Calificado" | "Perdido";
  tags: string[];
  campaign?: string | undefined;
  adName?: string | undefined;
  internalSource?: string | undefined;
}

export const leadTags = [
  "Newsletter",
  "Demo solicitada",
  "Precio",
  "Enterprise",
  "Referido",
  "Webinario",
  "Frío",
] as const;

// Genera leads distribuidos en los últimos ~400 días para que el filtrado
// por rango de fechas tenga sentido. Construido de forma perezosa para
// evitar Math.random en el ámbito de módulo (problema en Cloudflare Workers).
const FIRST_NAMES = [
  "Mara",
  "Theo",
  "Lina",
  "Owen",
  "Iris",
  "Nico",
  "Hana",
  "Leo",
  "Zoe",
  "Max",
  "Ada",
  "Kai",
  "Sofía",
  "Diego",
  "Elena",
  "Bruno",
  "Yuki",
  "Carmen",
  "Iván",
  "Noa",
];
const LAST_NAMES = [
  "Velez",
  "Park",
  "Sato",
  "Frye",
  "Cole",
  "Reyes",
  "Ito",
  "Marsh",
  "Quinn",
  "Dunn",
  "Lin",
  "Brooks",
  "Nakamura",
  "Costa",
  "Romero",
  "Schmidt",
  "Lopez",
  "Vargas",
  "Moreau",
  "Khan",
];
const SOURCES = [
  "Sitio web",
  "Instagram",
  "LinkedIn",
  "Anuncio",
  "Referido",
  "Webinario",
  "Formulario",
];
const STATUSES: Lead["status"][] = ["Nuevo", "Contactado", "Calificado", "Perdido"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

let cached: Lead[] | null = null;

export function getLeads(): Lead[] {
  if (cached) return cached;
  const rand = seededRandom(42);
  const today = new Date();
  const leads: Lead[] = [];
  for (let i = 0; i < 64; i++) {
    const daysAgo = Math.floor(rand() * 380);
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const tagCount = 1 + Math.floor(rand() * 2);
    const tags: string[] = [];
    for (let t = 0; t < tagCount; t++) {
      const tag = leadTags[Math.floor(rand() * leadTags.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }
    const source = SOURCES[Math.floor(rand() * SOURCES.length)] ?? "Meta Ads";
    const sampleCampaigns = [
      "Meta Ads — Convocatoria Principal",
      "Google Search — Búsqueda Cursos",
      "TikTok Ads — Campaña Impulso",
      "Webinario — Masterclass Abierta",
      "Instagram Stories — Descuento Especial",
    ];
    const campaign =
      source.includes("Meta") || source.includes("Facebook")
        ? "Meta Ads — Convocatoria Principal"
        : source.includes("Google")
          ? "Google Search — Búsqueda Cursos"
          : source.includes("TikTok")
            ? "TikTok Ads — Campaña Impulso"
            : source.includes("Webinario")
              ? "Webinario — Masterclass Abierta"
              : source.includes("Instagram")
                ? "Instagram Stories — Descuento Especial"
                : sampleCampaigns[i % sampleCampaigns.length];

    const sampleAds = [
      "ADS1: IMAGEN CHICA CON CERTIFICADO",
      "ADS2: IMAGEN CONTA CHICA CON LAPTOP",
      "ADS5: VIDEO CONTA TESTIMONIO",
      "ADS6: VIDEO MAGUS EXCEL",
      "ADS3: REEL PROSPECTOS VIRAL",
    ];
    const adName = sampleAds[i % sampleAds.length];
    const internalSource = source;

    leads.push({
      id: `#LD-${(1000 + i).toString()}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@mail.co`,
      phone: `+34 6${Math.floor(10000000 + rand() * 89999999)}`,
      source,
      date: d.toISOString().slice(0, 10),
      status: STATUSES[Math.floor(rand() * STATUSES.length)] ?? "Nuevo",
      tags,
      campaign,
      adName,
      internalSource,
    });
  }
  leads.sort((a, b) => (a.date < b.date ? 1 : -1));
  cached = leads;
  return leads;
}

/** Serie diaria de leads para el rango dado, para gráficas. */
export function leadsByDay(start: string, end: string): { date: string; count: number }[] {
  const leads = getLeads();
  const days: { date: string; count: number }[] = [];
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, count: leads.filter((l) => l.date === iso).length });
  }
  return days;
}

/** Serie mensual de leads (etiqueta de mes en español corto). */
const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function leadsByMonth(start: string, end: string): { month: string; count: number }[] {
  const leads = getLeads().filter((l) => l.date >= start && l.date <= end);
  const buckets: Record<string, number> = {};
  for (const l of leads) {
    const m = l.date.slice(0, 7); // yyyy-mm
    buckets[m] = (buckets[m] || 0) + 1;
  }
  return Object.keys(buckets)
    .sort()
    .map((m) => {
      const mi = Number(m.slice(5, 7)) - 1;
      return { month: MONTH_LABELS[mi] ?? m, count: buckets[m] };
    });
}
