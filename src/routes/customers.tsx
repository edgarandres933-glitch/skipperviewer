import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Mail,
  Phone,
  UserCog,
  Wallet,
  BookOpen,
  CalendarDays,
  Megaphone,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard";
import { DataSourceBanner } from "@/components/data-source-banner";
import type { CourseSchedule } from "@/lib/dashboard-data";
import { useCustomersQuery } from "@/lib/ghl-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Clientes — Skipper View" },
      { name: "description", content: "Fichas de clientes con curso, horario, pago y campaña." },
      { property: "og:title", content: "Clientes — Skipper View" },
      {
        property: "og:description",
        content: "Fichas de clientes con curso, horario, pago y campaña.",
      },
    ],
  }),
  component: CustomersPage,
});

const schedules: (CourseSchedule | "Todos")[] = ["Todos", "Mañana", "Tarde", "Noche"];
const payments = ["Todos", "Pago completo", "Abono"] as const;

const scheduleStyles: Record<CourseSchedule, string> = {
  Mañana: "bg-chart-1/15 text-chart-1",
  Tarde: "bg-chart-3/15 text-chart-3",
  Noche: "bg-chart-5/15 text-chart-5",
};

function CustomersPage() {
  const { range } = useDateRange();
  const { data: customers, isPending } = useCustomersQuery();
  const [query, setQuery] = useState("");
  const [schedule, setSchedule] = useState<(typeof schedules)[number]>("Todos");
  const [payment, setPayment] = useState<(typeof payments)[number]>("Todos");
  const [course, setCourse] = useState<string>("Todos");

  const rangeCustomers = useMemo(
    () => (customers ?? []).filter((c) => inRange(c.saleDate, range.start, range.end)),
    [customers, range.start, range.end],
  );

  const courses = useMemo(
    () => ["Todos", ...Array.from(new Set(rangeCustomers.map((c) => c.course))).sort()],
    [rangeCustomers],
  );

  const filtered = useMemo(() => {
    return rangeCustomers.filter((c) => {
      const q = query.toLowerCase();
      const matchesQuery =
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.course.toLowerCase().includes(q) ||
        c.campaign.toLowerCase().includes(q);
      const matchesSchedule = schedule === "Todos" || c.schedule === schedule;
      const matchesPayment = payment === "Todos" || c.paymentStatus === payment;
      const matchesCourse = course === "Todos" || c.course === course;
      return matchesQuery && matchesSchedule && matchesPayment && matchesCourse;
    });
  }, [rangeCustomers, query, schedule, payment, course]);

  return (
    <div>
      <DataSourceBanner sources={["contacts", "opportunities", "pipelines"]} />
      <PageHeader
        title="Clientes"
        subtitle={`${filtered.length} clientes · ${range.label.toLowerCase()}`}
        action={<Button size="sm">Añadir cliente</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nombre, teléfono, curso, campaña..."
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <FilterGroup label="Horario" options={schedules} value={schedule} onChange={setSchedule} />
        <FilterGroup label="Curso" options={courses} value={course} onChange={setCourse} />
        <FilterGroup label="Pago" options={payments} value={payment} onChange={setPayment} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isPending ? (
          <div className="col-span-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando clientes de tu subcuenta...
          </div>
        ) : (
          <>
            {filtered.map((c) => {
              const remaining = Math.max(0, c.spent - c.deposit);
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  {/* Encabezado */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-foreground">{c.name}</p>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                            scheduleStyles[c.schedule],
                          )}
                        >
                          {c.schedule}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <BookOpen className="size-3" /> {c.course}
                      </p>
                      {c.modality && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">{c.modality}</span>
                        </p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="size-3" /> {c.email || "—"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3" /> {c.phone || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Detalles del lead / curso */}
                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border pt-4 text-xs">
                    <Detail icon={UserCog} label="Propietario" value={c.owner} />
                    <Detail
                      icon={Wallet}
                      label="Pago"
                      value={
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 font-semibold",
                            c.paymentStatus === "Pago completo"
                              ? "bg-success/15 text-success"
                              : "bg-warning/15 text-warning",
                          )}
                        >
                          {c.paymentStatus}
                        </span>
                      }
                    />
                    <Detail
                      icon={Wallet}
                      label="Abonado"
                      value={`$${c.deposit.toLocaleString()}`}
                    />
                    <Detail icon={Wallet} label="Total" value={`$${c.spent.toLocaleString()}`} />
                    {c.paymentStatus === "Abono" && (
                      <Detail
                        icon={Wallet}
                        label="Saldo"
                        value={
                          <span className="font-semibold text-destructive">
                            ${remaining.toLocaleString()}
                          </span>
                        }
                      />
                    )}
                    <Detail icon={CalendarDays} label="Venta" value={c.saleDate} />
                    <Detail icon={Megaphone} label="Campaña" value={c.campaign} />
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                Ningún cliente coincide con tu búsqueda en este rango de fechas.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <span className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === o
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-0.5 truncate font-medium text-foreground">{value}</p>
    </div>
  );
}
