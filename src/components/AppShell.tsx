"use client";

import { useEffect, useMemo, useState } from "react";
import { Course, Section } from "@/types/schedule";
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
  
  // Estado para manejar las secciones seleccionadas
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
  const visibleSections = useMemo(() => {
    if (!data) return [];
    const visibleCourseIds = new Set(courses.map(c => c.id));
    return data.sections.filter((section) => visibleCourseIds.has(section.courseId));
  }, [data, courses]);

  const sectionsById = useMemo(() => {
    return Object.fromEntries((data?.sections ?? []).map((s) => [s.id, s]));
  }, [data]);

  const sectionsByNrc = useMemo(() => {
    return Object.fromEntries((data?.sections ?? []).map((s) => [s.nrc, s]));
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
        const linkedSection = sectionsByNrc[nrc];
        if (linkedSection) linked.push(linkedSection);
      }
    }

    const dedup = new Map(linked.map((ls) => [ls.id, ls]));
    return Array.from(dedup.values());
  }

  function onSelectSection(courseId: string, sectionId: string) {
    setSelectedByCourse((prev) => {
      const primary = sectionsById[sectionId];
      const linkedSelections = resolveLinkedSections(sectionId);

      const selections = [
        { courseId: primary?.courseId ?? courseId, sectionId },
        ...linkedSelections.map((section) => ({
          courseId: section.courseId,
          sectionId: section.id,
        })),
      ];

      const uniqueSelections = Array.from(
        new Map(selections.map((s) => [`${s.courseId}-${s.sectionId}`, s])).values()
      );

      const shouldRemove = uniqueSelections.every(({ courseId, sectionId }) =>
        (prev[courseId] ?? []).includes(sectionId)
      );

      const next: Record<string, string[]> = { ...prev };

      for (const { courseId: cid, sectionId: sid } of uniqueSelections) {
        const set = new Set(next[cid] ?? []);
        if (shouldRemove) {
          set.delete(sid);
        } else {
          set.add(sid);
        }
        if (set.size === 0) {
          delete next[cid];
        } else {
          next[cid] = Array.from(set);
        }
      }

      return next;
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
              Cursos: {courses.length} · Secciones visibles: {visibleSections.length}
            </div>
          </div>

          <CourseSidebar
            courses={courses}
            sections={visibleSections}
            selectedSectionByCourse={selectedByCourse}
            onHoverSection={setHoveredSectionId}
            onSelectSection={onSelectSection}
          />
        </aside>

        <main className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-4 border">
          <ScheduleGrid
            sectionsById={sectionsById}
            selectedSectionIds={selectedSectionIds}
            previewSectionId={hoveredSectionId}
          />
        </main>
      </div>
    </div>
  );
}
