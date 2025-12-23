import { DAYS, BLOCKS } from "@/lib/unabBlocks";
import { Day, BlockIndex, Section, Course } from "@/types/schedule";

type Props = {
  sectionsById: Record<string, Section>;
  coursesById: Record<string, Course>;
  courseColors: Record<string, string>;
  selectedSectionIds: string[];
  previewSectionId: string | null;
};

type OccupancySpan = {
  section: Section;
  day: Day;
  startBlock: BlockIndex;
  span: number;
  slotKeys: string[];
};

const BLOCK_INDEX_TO_ROW = new Map<number, number>(
  BLOCKS.map((b, idx) => [b.index, idx + 1])
);
const DAY_TO_COLUMN = new Map<Day, number>(
  DAYS.map((d, idx) => [d as Day, idx + 2])
);

function computeSpansForSection(section: Section): OccupancySpan[] {
  const spans: OccupancySpan[] = [];

  for (const meeting of section.meetings) {
    const blocks = [...meeting.blocks].sort((a, b) => a - b);
    if (blocks.length === 0) continue;

    let start = blocks[0];
    let currentSpan = 1;
    let slots: string[] = [`${meeting.day}-${blocks[0]}`];

    for (let i = 1; i < blocks.length; i += 1) {
      const prev = blocks[i - 1];
      const curr = blocks[i];

      if (curr === prev + 1) {
        currentSpan += 1;
        slots.push(`${meeting.day}-${curr}`);
      } else {
        spans.push({
          section,
          day: meeting.day as Day,
          startBlock: start as BlockIndex,
          span: currentSpan,
          slotKeys: slots,
        });
        start = curr;
        currentSpan = 1;
        slots = [`${meeting.day}-${curr}`];
      }
    }

    spans.push({
      section,
      day: meeting.day as Day,
      startBlock: start as BlockIndex,
      span: currentSpan,
      slotKeys: slots,
    });
  }

  return spans;
}

function buildOccupancy(
  sectionsById: Record<string, Section>,
  sectionIds: string[]
): { spans: OccupancySpan[]; occ: Map<string, string> } {
  const occ = new Map<string, string>();
  const spans: OccupancySpan[] = [];

  for (const sid of sectionIds) {
    const s = sectionsById[sid];
    if (!s) continue;

    const sectionSpans = computeSpansForSection(s);
    spans.push(...sectionSpans);

    for (const sp of sectionSpans) {
      for (const key of sp.slotKeys) {
        occ.set(key, sid);
      }
    }
  }
  return { spans, occ };
}

export default function ScheduleGrid({
  sectionsById,
  selectedSectionIds,
  previewSectionId,
  coursesById,
  courseColors,
}: Props) {
  const { spans, occ } = buildOccupancy(sectionsById, selectedSectionIds);
  const preview = previewSectionId ? sectionsById[previewSectionId] : null;

  const previewSpans = preview ? computeSpansForSection(preview) : [];
  const previewConflict =
    previewSpans.length > 0 &&
    previewSpans.some((sp) => sp.slotKeys.some((key) => occ.has(key)));

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

      <div
        className="relative grid grid-cols-[120px_repeat(6,1fr)] gap-2"
        style={{
          gridTemplateRows: `repeat(${BLOCKS.length}, minmax(3.5rem, 1fr))`,
        }}
      >
        {/* hour labels */}
        {BLOCKS.map((blk, idx) => (
          <div
            key={`label-${blk.index}`}
            className="text-sm text-zinc-600 flex items-center"
            style={{ gridColumn: 1, gridRow: idx + 1 }}
          >
            {blk.start} - {blk.end}
          </div>
        ))}

        {/* background cells */}
        {DAYS.map((day) =>
          BLOCKS.map((blk) => (
            <div
              key={`bg-${day}-${blk.index}`}
              className="h-full rounded-xl bg-zinc-50 border border-zinc-100"
              style={{
                gridColumn: DAY_TO_COLUMN.get(day as Day),
                gridRow: BLOCK_INDEX_TO_ROW.get(blk.index),
              }}
            />
          ))
        )}

        {/* selected sections */}
        {spans.map((sp) => {
          const col = DAY_TO_COLUMN.get(sp.day);
          const row = BLOCK_INDEX_TO_ROW.get(sp.startBlock);
          if (!col || !row) return null;

          const course = coursesById[sp.section.courseId];
          const courseColor =
            courseColors[sp.section.courseId] ?? "hsl(221 39% 11%)";
          const shortName = course?.code ?? sp.section.courseId;

          return (
            <div
              key={`${sp.section.id}-${sp.day}-${sp.startBlock}`}
              className="rounded-lg text-white text-xs p-2 flex flex-col gap-0.5"
              style={{
                gridColumn: col,
                gridRow: `${row} / span ${sp.span}`,
                backgroundColor: courseColor,
                borderColor: courseColor,
                borderWidth: 1,
              }}
            >
              <div className="font-semibold">{shortName}</div>
              <div className="opacity-90">NRC {sp.section.nrc}</div>
              {sp.section.activityType ? (
                <div className="opacity-90 uppercase text-[10px] tracking-wide">
                  {sp.section.activityType}
                </div>
              ) : null}
            </div>
          );
        })}

        {/* preview spans */}
        {!previewConflict &&
          previewSpans.map((sp) => {
            const col = DAY_TO_COLUMN.get(sp.day);
            const row = BLOCK_INDEX_TO_ROW.get(sp.startBlock);
            if (!col || !row) return null;
            return (
              <div
                key={`preview-${sp.section.id}-${sp.day}-${sp.startBlock}`}
                className="rounded-lg border text-xs p-2 flex flex-col gap-0.5 bg-white/80"
                style={{
                  gridColumn: col,
                  gridRow: `${row} / span ${sp.span}`,
                }}
              >
                <div className="font-semibold">{sp.section.courseId}</div>
                <div className="opacity-80">NRC {sp.section.nrc}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
