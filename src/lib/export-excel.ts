export interface StudentRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  date?: string;
  advisor?: string;
  source?: string;
  modality?: string;
  paymentStatus?: string;
  paid: number;
  saldo: number;
  total: number;
}

export interface CourseConsolidated {
  key: string;
  label: string;
  tag?: string;
  totalLeads: number;
  wonLeads: number;
  revenue: number;
  saldoPendiente: number;
  projectedRevenue: number;
  presencial: number;
  virtual: number;
  fullPayment: number;
  abono: number;
  convRate: string;
  avgTicket: number;
  advisorsList: { name: string; won: number; revenue: number }[];
  channelsList: { name: string; won: number; revenue: number }[];
  students: StudentRow[];
}

export interface GrandTotal {
  totalLeads: number;
  wonLeads: number;
  revenue: number;
  saldoPendiente: number;
  projectedRevenue: number;
  presencial: number;
  virtual: number;
  fullPayment: number;
  abono: number;
}

/**
 * Calcula anchos de columnas automáticos para que no aparezcan cortadas ni con ### en Excel.
 */
function calculateColWidths(headers: string[], rows: (string | number | undefined | null)[][]): { wch: number }[] {
  return headers.map((header, colIdx) => {
    let maxLen = header.length;
    for (const row of rows) {
      const val = row[colIdx];
      if (val !== undefined && val !== null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
}

/**
 * Exporta el reporte consolidado completo a un libro de Microsoft Excel (.xlsx)
 * con múltiples pestañas profesionales:
 * 1. Resumen Consolidado de Cursos
 * 2. Detalle de Todos los Alumnos
 * 3. Rendimiento por Asesor Comercial
 * 4. Canales de Captación
 */
export async function exportConsolidadosToExcel({
  courses,
  grandTotal,
  globalConversion,
  dateRangeLabel,
}: {
  courses: CourseConsolidated[];
  grandTotal: GrandTotal;
  globalConversion: string;
  dateRangeLabel?: string;
}) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // HOJA 1: RESUMEN CONSOLIDADO POR CURSO
  // -------------------------------------------------------------
  const headersSheet1 = [
    "Programa / Curso",
    "Interesados (Leads)",
    "Matriculados (Ganados)",
    "Tasa de Cierre",
    "Recaudación Cobrada ($)",
    "Saldo Pendiente ($)",
    "Total Facturado ($)",
    "Ticket Promedio ($)",
    "Modalidad Presencial",
    "Modalidad Virtual",
    "Pagos Completos",
    "Abonos / Parciales",
  ];

  const rowsSheet1: (string | number)[][] = courses.map((c) => [
    c.label,
    c.totalLeads,
    c.wonLeads,
    `${c.convRate}%`,
    c.revenue,
    c.saldoPendiente,
    c.projectedRevenue,
    c.avgTicket,
    c.presencial,
    c.virtual,
    c.fullPayment,
    c.abono,
  ]);

  // Fila de Total General
  rowsSheet1.push([
    "TOTAL GENERAL CONSOLIDADO",
    grandTotal.totalLeads,
    grandTotal.wonLeads,
    `${globalConversion}%`,
    grandTotal.revenue,
    grandTotal.saldoPendiente,
    grandTotal.projectedRevenue,
    grandTotal.wonLeads ? Math.round(grandTotal.revenue / grandTotal.wonLeads) : 0,
    grandTotal.presencial,
    grandTotal.virtual,
    grandTotal.fullPayment,
    grandTotal.abono,
  ]);

  const ws1Data = [headersSheet1, ...rowsSheet1];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1["!cols"] = calculateColWidths(headersSheet1, rowsSheet1);
  XLSX.utils.book_append_sheet(wb, ws1, "Resumen Cursos");

  // -------------------------------------------------------------
  // HOJA 2: DETALLE DE TODOS LOS ALUMNOS MATRICULADOS
  // -------------------------------------------------------------
  const headersSheet2 = [
    "Nombre del Alumno",
    "Curso / Programa",
    "Fecha",
    "Asesor Comercial",
    "Canal / Fuente",
    "Modalidad",
    "Estado de Pago",
    "Recaudado ($)",
    "Saldo Pendiente ($)",
    "Total Curso ($)",
    "Email",
    "Teléfono",
  ];

  const allStudents: (string | number)[][] = [];
  for (const c of courses) {
    for (const st of c.students) {
      allStudents.push([
        st.name || "Sin nombre",
        c.label,
        st.date || "—",
        st.advisor || "Sin asignar",
        st.source || "Directo / CRM",
        st.modality || "Virtual",
        st.paymentStatus || "Pendiente",
        st.paid || 0,
        st.saldo || 0,
        st.total || 0,
        st.email || "—",
        st.phone || "—",
      ]);
    }
  }

  // Ordenar por fecha descendente
  allStudents.sort((a, b) => String(b[2]).localeCompare(String(a[2])));

  const ws2Data = [headersSheet2, ...allStudents];
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2["!cols"] = calculateColWidths(headersSheet2, allStudents);
  XLSX.utils.book_append_sheet(wb, ws2, "Detalle de Alumnos");

  // -------------------------------------------------------------
  // HOJA 3: RENDIMIENTO CONSOLIDADO POR ASESOR
  // -------------------------------------------------------------
  const advisorMap = new Map<string, { won: number; revenue: number; courses: Set<string> }>();
  for (const c of courses) {
    for (const adv of c.advisorsList) {
      if (!advisorMap.has(adv.name)) {
        advisorMap.set(adv.name, { won: 0, revenue: 0, courses: new Set() });
      }
      const entry = advisorMap.get(adv.name)!;
      entry.won += adv.won;
      entry.revenue += adv.revenue;
      entry.courses.add(c.label);
    }
  }

  const headersSheet3 = [
    "Asesor Comercial",
    "Matrículas Cerradas",
    "Recaudación Generada ($)",
    "Ticket Promedio ($)",
    "Cursos Implicados",
  ];

  const rowsSheet3: (string | number)[][] = Array.from(advisorMap.entries())
    .map(([name, stat]) => [
      name,
      stat.won,
      stat.revenue,
      stat.won ? Math.round(stat.revenue / stat.won) : 0,
      Array.from(stat.courses).join(", "),
    ])
    .sort((a, b) => Number(b[2]) - Number(a[2]));

  const ws3Data = [headersSheet3, ...rowsSheet3];
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
  ws3["!cols"] = calculateColWidths(headersSheet3, rowsSheet3);
  XLSX.utils.book_append_sheet(wb, ws3, "Ventas por Asesor");

  // -------------------------------------------------------------
  // HOJA 4: FUENTES Y CANALES DE CAPTACIÓN
  // -------------------------------------------------------------
  const channelMap = new Map<string, { won: number; revenue: number }>();
  for (const c of courses) {
    for (const ch of c.channelsList) {
      if (!channelMap.has(ch.name)) {
        channelMap.set(ch.name, { won: 0, revenue: 0 });
      }
      const entry = channelMap.get(ch.name)!;
      entry.won += ch.won;
      entry.revenue += ch.revenue;
    }
  }

  const headersSheet4 = [
    "Canal de Captación / Fuente",
    "Alumnos Matriculados",
    "Recaudación Generada ($)",
    "Ticket Promedio ($)",
  ];

  const rowsSheet4: (string | number)[][] = Array.from(channelMap.entries())
    .map(([name, stat]) => [
      name,
      stat.won,
      stat.revenue,
      stat.won ? Math.round(stat.revenue / stat.won) : 0,
    ])
    .sort((a, b) => Number(b[2]) - Number(a[2]));

  const ws4Data = [headersSheet4, ...rowsSheet4];
  const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
  ws4["!cols"] = calculateColWidths(headersSheet4, rowsSheet4);
  XLSX.utils.book_append_sheet(wb, ws4, "Fuentes de Captación");

  // -------------------------------------------------------------
  // DESCARGA DEL ARCHIVO .XLSX
  // -------------------------------------------------------------
  const cleanDate = (dateRangeLabel || "periodo")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/__+/g, "_");
  const fileName = `SkipperView_Consolidado_Cursos_${cleanDate}.xlsx`;

  XLSX.writeFile(wb, fileName, { compression: true });
}

/**
 * Exporta los alumnos y métricas de un curso en específico a un archivo Excel (.xlsx).
 */
export async function exportSingleCourseToExcel({
  course,
  dateRangeLabel,
}: {
  course: CourseConsolidated;
  dateRangeLabel?: string;
}) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen y Alumnos del Curso
  const headers = [
    "Nombre del Alumno",
    "Email",
    "Teléfono",
    "Fecha",
    "Asesor Comercial",
    "Canal / Fuente",
    "Modalidad",
    "Estado de Pago",
    "Recaudado ($)",
    "Saldo Pendiente ($)",
    "Total Curso ($)",
  ];

  const rows: (string | number)[][] = course.students.map((st) => [
    st.name || "Sin nombre",
    st.email || "—",
    st.phone || "—",
    st.date || "—",
    st.advisor || "Sin asignar",
    st.source || "Directo / CRM",
    st.modality || "Virtual",
    st.paymentStatus || "Pendiente",
    st.paid || 0,
    st.saldo || 0,
    st.total || 0,
  ]);

  // Fila total del curso
  rows.push([
    `TOTAL ${course.label.toUpperCase()}`,
    "",
    "",
    "",
    "",
    "",
    `Presencial: ${course.presencial} | Virtual: ${course.virtual}`,
    `Completos: ${course.fullPayment} | Abonos: ${course.abono}`,
    course.revenue,
    course.saldoPendiente,
    course.projectedRevenue,
  ]);

  const wsData = [
    [`REPORTE DE ALUMNOS: ${course.label.toUpperCase()}`],
    [`Período: ${dateRangeLabel || "Todos los registros"}`],
    [`Total Matriculados: ${course.wonLeads} | Recaudación Cobrada: $${course.revenue.toLocaleString()} | Saldo Pendiente: $${course.saldoPendiente.toLocaleString()}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = calculateColWidths(headers, rows);
  XLSX.utils.book_append_sheet(wb, ws, "Alumnos Matriculados");

  const cleanCourse = course.label.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `SkipperView_${cleanCourse}_Alumnos.xlsx`;
  XLSX.writeFile(wb, fileName, { compression: true });
}
