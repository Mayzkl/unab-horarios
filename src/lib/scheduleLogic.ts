import type { Day, BlockIndex, Section } from "@/types/schedule";

export type SlotKey = `${Day}-${BlockIndex}`;

/** Devuelve un set con todos los slots (día-bloque) que ocupa una sección */
export function sectionSlots(section: Section): Set<SlotKey> {
  const set = new Set<SlotKey>();
  for (const m of section.meetings) {
    for (const b of m.blocks) {
      set.add(`${m.day}-${b}` as SlotKey);
    }
  }
  return set;
}

/** Construye ocupación de slots a partir de secciones ya seleccionadas */
export function buildOccupancy(
  sectionsById: Record<string, Section>,
  selectedSectionIds: string[]
): Map<SlotKey, string> {
  // slot -> sectionId
  const occ = new Map<SlotKey, string>();
  for (const sid of selectedSectionIds) {
    const s = sectionsById[sid];
    if (!s) continue;
    for (const slot of sectionSlots(s)) {
      occ.set(slot, sid);
    }
  }
  return occ;
}

/** Retorna el primer conflicto encontrado (si existe) */
export function findConflict(
  occ: Map<SlotKey, string>,
  candidate: Section
): { slot: SlotKey; conflictingSectionId: string } | null {
  for (const slot of sectionSlots(candidate)) {
    const other = occ.get(slot);
    if (other) return { slot, conflictingSectionId: other };
  }
  return null;
}

/** Helper para mostrar el slot bonito */
export function formatSlot(slot: SlotKey) {
  const [day, block] = slot.split("-");
  return `${day} · B${block}`;
}
