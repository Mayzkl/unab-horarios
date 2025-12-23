import { DAYS, BLOCKS } from "@/lib/unabBlocks";
import { Day, BlockIndex, Section } from "@/types/schedule";

type Props = {
  sectionsById: Record<string, Section>;
  selectedSectionIds: string[];
  previewSectionId: string | null;
  highlightSlot?: string | null;
};

function buildOccupancy(
  sectionsById: Record<string, Section>,
  sectionIds: string[]
): Map<string, string> {
  // key = `${day}-${block}` value = sectionId
  const occ = new Map<string, string>();
  for (const sid of sectionIds) {
    const s = sectionsById[sid];
    if (!s) continue;
    for (const m of s.meetings) {
      for (const b of m.blocks) {
        occ.set(`${m.day}-${b}`, sid);
      }
    }
  }
  return occ;
}

function hasPreviewConflict(occ: Map<string, string>, preview: Section | null) {
  if (!preview) return false;
  for (const m of preview.meetings) {
    for (const b of m.blocks) {
      if (occ.has(`${m.day}-${b}`)) return true;
    }
  }
  return false;
}

export default function ScheduleGrid({
  sectionsById,
  selectedSectionIds,
  previewSectionId,
  highlightSlot,
}: Props) {
  const occ = buildOccupancy(sectionsById, selectedSectionIds);
  const preview = previewSectionId ? sectionsById[previewSectionId] : null;
  const previewConflict = hasPreviewConflict(occ, preview);

  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold mb-3">HORARIOS SEMANALES</h1>

      {/* header days */}
      <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-2 mb-2">
        <div />
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center font-medium bg-zinc-100 rounded-xl py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-2">
        {BLOCKS.map((blk) => (
          <Row
            key={blk.index}
            block={blk.index}
            label={`${blk.start} - ${blk.end}`}
            occ={occ}
            sectionsById={sectionsById}
            preview={preview}
            previewConflict={previewConflict}
            highlightSlot={highlightSlot}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  block,
  label,
  occ,
  sectionsById,
  preview,
  previewConflict,
  highlightSlot,
}: {
  block: BlockIndex;
  label: string;
  occ: Map<string, string>;
  sectionsById: Record<string, Section>;
  preview: Section | null;
  previewConflict: boolean;
  highlightSlot?: string | null;
}) {
  return (
    <>
      <div className="text-sm text-zinc-600 flex items-center">{label}</div>

      {DAYS.map((day) => (
        <Cell
          key={`${day}-${block}`}
          day={day as Day}
          block={block}
          occ={occ}
          sectionsById={sectionsById}
          preview={preview}
          previewConflict={previewConflict}
          highlightSlot={highlightSlot}
        />
      ))}
    </>
  );
}

function Cell({
  day,
  block,
  occ,
  sectionsById,
  preview,
  previewConflict,
  highlightSlot,
}: {
  day: Day;
  block: BlockIndex;
  occ: Map<string, string>;
  sectionsById: Record<string, Section>;
  preview: Section | null;
  previewConflict: boolean;
  highlightSlot?: string | null;
}) {
  const key = `${day}-${block}`;

  const isHighlighted = highlightSlot === key;

  const sid = occ.get(key);
  const occupied = sid ? sectionsById[sid] : null;

  const previewCovers =
    preview?.meetings.some((m) => m.day === day && m.blocks.includes(block)) ??
    false;

  return (
    <div
      className={[
        "relative h-14 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden transition",
        isHighlighted ? "ring-4 ring-red-400 border-red-300" : "",
      ].join(" ")}
    >
      {occupied && (
        <div className="absolute inset-1 rounded-lg bg-zinc-900 text-white text-xs p-2">
          <div className="font-semibold">{occupied.courseId}</div>
          <div className="opacity-80">NRC {occupied.nrc}</div>
        </div>
      )}

      {previewCovers && !occupied && (
        <div
          className={[
            "absolute inset-1 rounded-lg border text-xs p-2",
            previewConflict
              ? "border-red-400 bg-red-50 text-red-700"
              : "border-zinc-400 bg-white text-zinc-700",
          ].join(" ")}
        >
          <div className="font-semibold">{preview!.courseId}</div>
          <div className="opacity-80">NRC {preview!.nrc}</div>
        </div>
      )}
    </div>
  );
}
