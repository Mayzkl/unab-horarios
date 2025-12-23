"use client";

import { useEffect, useMemo, useState } from "react";
import { Course, Section } from "@/types/schedule";
import { buildOccupancy, findConflict, formatSlot } from "@/lib/scheduleLogic";
import CourseSidebar from "@/components/CourseSidebar";
import ScheduleGrid from "@/components/ScheduleGrid";

type NormalizedData = {
  semesters: Record<string, { courseCount: number; sectionCount: number }>;
  courses: Course[];
  sections: Section[];
};

export default function AppShell() {
  const [data, setData] = useState<NormalizedData | null>(null);
  const [semester, setSemester] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [highlightSlot, setHighlightSlot] = useState<string | null>(null);
  
  // Estado para manejar las secciones seleccionadas
  // Cambiar a un arreglo en vez de una cadena de texto para almacenar múltiples selecciones
  const [selectedByCourse, setSelectedByCourse] = useState<Record<string, string[]>>({});


  // Cargar datos desde la API
  useEffect(() => {
    (async () => {
      const res = await fetch("/data/data_unab_normalized.json");
      if (!res.ok) throw new Error("No se pudo cargar data_unab_normalized.json");
      const json = await res.json();
      setData(json);

      // Configuración inicial para el semestre
      const first = Object.keys(json.semesters ?? {})[0] ?? "";
      setSemester(first);
    })().catch((e) => {
      console.error(e);
      alert("Error cargando el JSON.");
    });
  }, []);

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
  const sections = useMemo(() => {
    if (!data) return [];
    const visibleCourseIds = new Set(courses.map(c => c.id));
    return data.sections.filter((section) => visibleCourseIds.has(section.courseId));
  }, [data, courses]);

  const sectionsById = useMemo(() => {
    return Object.fromEntries(sections.map((s) => [s.id, s]));
  }, [sections]);

  // Obtener solo los IDs de las secciones seleccionadas
  const selectedSectionIds = useMemo(() => {
    return Object.values(selectedByCourse).flat().filter(Boolean) as string[];
  }, [selectedByCourse]);

  function onSelectSection(courseId: string, sectionId: string) {
    setSelectedByCourse((prev) => {
      const selectedSections = prev[courseId] || [];

      // Si la sección ya está seleccionada, la eliminamos
      if (selectedSections.includes(sectionId)) {
        return {
          ...prev,
          [courseId]: selectedSections.filter((id) => id !== sectionId),
        };
      }

      // Si no está seleccionada, la agregamos
      return { ...prev, [courseId]: [...selectedSections, sectionId] };
    });
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
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border">
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
              Cursos: {courses.length} · Secciones visibles: {sections.length}
            </div>
          </div>

          <CourseSidebar
            courses={courses}
            sections={sections}
            selectedSectionByCourse={selectedByCourse}
            onHoverSection={setHoveredSectionId}
            onSelectSection={onSelectSection}
          />
        </aside>

        <main className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-4 border">
          <ScheduleGrid
            courses={courses}
            sectionsById={sectionsById}
            selectedSectionIds={selectedSectionIds}
            previewSectionId={hoveredSectionId}
            highlightSlot={highlightSlot}
          />
        </main>
      </div>
    </div>
  );
}

