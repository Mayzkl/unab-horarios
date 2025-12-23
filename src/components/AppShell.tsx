"use client";

import { useEffect, useMemo, useState } from "react";
import { Course, Section } from "@/types/schedule";
import CourseSidebar from "@/components/CourseSidebar";
import ScheduleGrid from "@/components/ScheduleGrid";

const STORAGE_KEY = "unab-horarios/selection";

type DatasetOption = {
  id: string;
  label: string;
  path: string;
};

// Catálogo de datasets disponibles (extender con nuevas carreras/semestres)
const DATASET_OPTIONS: DatasetOption[] = [
  {
    id: "icinf-2026-1",
    label: "Ing. Civil Informática · 2026-1",
    path: "/data/data_unab_normalized.json",
  },
  {
    id: "industrial-2026-1",
    label: "Ing. Civil Industrial · 2026-1",
    path: "/data/data_unab_industrial_2026_1.json"
  },
  {
    id: "construccion-2026-1",
    label: "Ing. Construccion · 2026-1",
    path: "/data/data_unab_construccion_2026_1.json"
  }
  // Ejemplo para futuros datasets (dejar comentado):
  // {
  //   id: "otra-carrera-2026-1",
  //   label: "Otra carrera · 2026-1",
  //   path: "/data/data_unab_otra_carrera_2026_1.json",
  // },
];

const COURSE_COLOR_PALETTE = [
  "hsl(4 82% 47%)",   // rojo
  "hsl(27 93% 55%)",  // naranja
  "hsl(43 89% 52%)",  // amarillo
  "hsl(142 71% 45%)", // verde
  "hsl(199 89% 48%)", // celeste
  "hsl(221 83% 53%)", // azul
  "hsl(262 83% 58%)", // violeta
  "hsl(316 73% 52%)", // magenta
];

function fallbackColorFromString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 45%)`;
}

type NormalizedData = {
  semesters: Record<string, { courseCount: number; sectionCount: number }>;
  courses: Course[];
  sections: Section[];
};

export default function AppShell() {
  const [datasetId, setDatasetId] = useState<string>(DATASET_OPTIONS[0].id);
  const [data, setData] = useState<NormalizedData | null>(null);
  const [semester, setSemester] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  
  // Estado para manejar las secciones seleccionadas
  const [selectedByCourse, setSelectedByCourse] = useState<Record<string, string[]>>({});


  // Cargar datos desde la API
  useEffect(() => {
    const dataset = DATASET_OPTIONS.find((d) => d.id === datasetId) ?? DATASET_OPTIONS[0];

    (async () => {
      const res = await fetch(dataset.path);
      if (!res.ok) throw new Error(`No se pudo cargar ${dataset.path}`);
      const json = await res.json();
      setData(json);

      // Configuración inicial para el semestre
      const first = Object.keys(json.semesters ?? {})[0] ?? "";
      setSemester(first);

      // Intentar restaurar guardado local si coincide dataset y semestre
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed.datasetId === dataset.id &&
            parsed.semester === first &&
            parsed.selectedByCourse
          ) {
            setSelectedByCourse(parsed.selectedByCourse);
            return;
          }
        }
      } catch {
        // ignoramos errores de parseo
      }

      // Si no hay coincidencia en storage, limpiar selección
      setSelectedByCourse({});
    })().catch((e) => {
      console.error(e);
      alert("Error cargando el JSON.");
    });
  }, [datasetId]);

  // Filtra los cursos por semestre y búsqueda
  const courses = useMemo(() => {
    if (!data) return [];
    return data.courses.filter((course) => {
      const matchSemester = course.semester === semester;
      const matchQuery = query.trim() === "" || course.code.toLowerCase().includes(query.toLowerCase()) || course.name.toLowerCase().includes(query.toLowerCase());
      return matchSemester && matchQuery;
    });
  }, [data, semester, query]);

  // Filtra las secciones solo de los cursos visibles
  const visibleSections = useMemo(() => {
    if (!data) return [];
    const visibleCourseIds = new Set(courses.map(c => c.id));
    return data.sections.filter((section) => visibleCourseIds.has(section.courseId));
  }, [data, courses]);

  const sectionsById = useMemo(() => {
    return Object.fromEntries((data?.sections ?? []).map((s) => [s.id, s]));
  }, [data]);

  const coursesById = useMemo(() => {
    return Object.fromEntries((data?.courses ?? []).map((c) => [c.id, c]));
  }, [data]);

  const courseColors = useMemo(() => {
    const colors: Record<string, string> = {};
    const coursesList = data?.courses ?? [];
    coursesList.forEach((course, idx) => {
      const paletteColor = COURSE_COLOR_PALETTE[idx % COURSE_COLOR_PALETTE.length];
      colors[course.id] = paletteColor ?? fallbackColorFromString(course.id);
    });
    return colors;
  }, [data]);

  // Obtener solo los IDs de las secciones seleccionadas
  const selectedSectionIds = useMemo(() => {
    return Object.values(selectedByCourse).flat().filter(Boolean) as string[];
  }, [selectedByCourse]);

  function resolveLinkedSections(sectionId: string): Section[] {
    const section = sectionsById[sectionId];
    if (!section) return [];

    const linked: Section[] = [];

    if (Array.isArray(section.linkedSections) && section.linkedSections.length > 0) {
      for (const linkedSection of section.linkedSections) {
        if (linkedSection?.id) linked.push(linkedSection);
      }
    }

    if (section.linkedNrcRaw) {
      const linkedNrcs = section.linkedNrcRaw.match(/\d+/g) ?? [];
      for (const nrc of linkedNrcs) {
        const linkedSection = sectionsById[nrc];
        if (linkedSection) linked.push(linkedSection);
      }
    }

    const dedup = new Map(linked.map((ls) => [ls.id, ls]));
    return Array.from(dedup.values());
  }

  function onSelectSection(courseId: string, sectionId: string) {
    setSelectedByCourse((prev) => {
      const section = sectionsById[sectionId];
      if (!section) return prev;

      const currentSelections = prev[courseId] ?? [];
      const isAlreadySelected = currentSelections.includes(sectionId);

      // Si se vuelve a hacer click, deseleccionamos solo esa sección.
      if (isAlreadySelected) {
        const remaining = currentSelections.filter((id) => id !== sectionId);
        const next = { ...prev };
        if (remaining.length === 0) {
          delete next[courseId];
        } else {
          next[courseId] = remaining;
        }
        return next;
      }

      // Asegurar máximo 1 sección por tipo de actividad (TEO/TAL, etc.) dentro del mismo ramo.
      const filteredByActivity = currentSelections.filter((id) => {
        const existing = sectionsById[id];
        if (!existing) return true;
        return existing.activityType !== section.activityType;
      });

      const nextSelections = [...filteredByActivity, sectionId];

      return {
        ...prev,
        [courseId]: nextSelections,
      };
    });
  }

  function onSaveSchedule() {
    const payload = {
      datasetId,
      semester,
      selectedByCourse,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      alert("Horario guardado localmente.");
    } catch {
      alert("No se pudo guardar el horario.");
    }
  }

  function onExportPdf() {
    window.print();
  }


  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-600">Cargando data…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-4 space-y-4 no-print">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border shadow-sm">
            <div className="text-sm font-semibold mb-2">Carrera / Dataset</div>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="w-full border rounded-xl p-2 mb-3"
            >
              {DATASET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="text-sm font-semibold mb-2">Semestre</div>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border rounded-xl p-2"
            >
              {Object.keys(data.semesters).map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>

            <div className="text-sm font-semibold mt-4 mb-2">Buscar ramo</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: TDFI101, estructuras, programación…"
              className="w-full border rounded-xl p-2"
            />

            <div className="text-xs text-zinc-500 mt-3">
              Cursos: {courses.length} · Secciones visibles: {visibleSections.length}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                onClick={onSaveSchedule}
                className="w-full rounded-xl bg-zinc-900 text-white px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
              >
                Guardar horario (local)
              </button>
              <button
                onClick={onExportPdf}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Exportar PDF
              </button>
            </div>

            <button
              onClick={onSaveSchedule}
              className="mt-3 w-full rounded-xl bg-zinc-900 text-white px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Guardar horario (local)
            </button>
          </div>

          <CourseSidebar
            courses={courses}
            sections={visibleSections}
            selectedSectionByCourse={selectedByCourse}
            onHoverSection={setHoveredSectionId}
            onSelectSection={onSelectSection}
          />
        </aside>

        <main className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-4 border shadow-sm schedule-printable">
          <ScheduleGrid
            sectionsById={sectionsById}
            coursesById={coursesById}
            courseColors={courseColors}
            selectedSectionIds={selectedSectionIds}
            previewSectionId={hoveredSectionId}
          />
        </main>
      </div>
    </div>
  );
}
