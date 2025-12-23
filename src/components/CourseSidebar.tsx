import { Course, Section } from "@/types/schedule";

type Props = {
  courses: Course[];
  sections: Section[];
  selectedSectionByCourse: Record<string, string[]>;
  onHoverSection: (sectionId: string | null) => void;
  onSelectSection: (courseId: string, sectionId: string) => void;
};

export default function CourseSidebar({
  courses,
  sections,
  selectedSectionByCourse,
  onHoverSection,
  onSelectSection,
}: Props) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-3">Ramos</h2>

      <div className="space-y-4">
        {courses.map((c) => {
          const opts = sections.filter((s) => s.courseId === c.id);
          const selected = selectedSectionByCourse[c.id];

          return (
            <div key={c.id} className="bg-white rounded-2xl p-3 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{c.code}</div>
                  <div className="text-sm text-zinc-600">{c.name}</div>
                </div>
                {selected?.length ? (
                  <span className="text-xs bg-zinc-900 text-white px-2 py-1 rounded-full">
                    seleccionado
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {opts.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left rounded-xl border p-2 hover:bg-zinc-50"
                    onMouseEnter={() => onHoverSection(s.id)}
                    onMouseLeave={() => onHoverSection(null)}
                    onClick={() => onSelectSection(c.id, s.id)}
                  >
                    <div className="text-sm font-medium">
                      NRC {s.nrc} {s.professor ? `· ${s.professor}` : ""}
                    </div>
                    <div className="text-xs text-zinc-600">
                      {s.meetings
                        .map((m) => `${m.day} B${m.blocks.join(",")}`)
                        .join(" · ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
