import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/advisors")({
  head: () => ({
    meta: [
      { title: "Asesores — Skipper View" },
      {
        name: "description",
        content:
          "Rendimiento de asesores: porcentaje de ventas sobre leads asignados y leads marcados como Ganado.",
      },
      { property: "og:title", content: "Asesores — Skipper View" },
      {
        property: "og:description",
        content:
          "Rendimiento de asesores: porcentaje de ventas sobre leads asignados y leads marcados como Ganado.",
      },
    ],
  }),
  component: AdvisorsLayout,
});

function AdvisorsLayout() {
  return <Outlet />;
}
