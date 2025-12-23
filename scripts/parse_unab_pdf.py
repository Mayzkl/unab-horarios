import sys
import json
import re
from typing import List, Dict, Any, Optional, Tuple
import pdfplumber

# Mapea bloque UNAB (inicio, fin)
UNAB_BLOCKS: List[Tuple[int, str, str]] = [
    (1, "08:30", "10:10"),
    (2, "10:20", "12:00"),
    (3, "12:10", "13:50"),
    (4, "14:00", "15:40"),
    (5, "15:50", "17:30"),
    (6, "17:40", "19:20"),
    (7, "19:30", "21:10"),
]

DAY_MAP = {"LU": "LU", "MA": "MA", "MI": "MI", "JU": "JU", "VI": "VI", "SA": "SA"}

NRC_RE = re.compile(r"\b(\d{4,6})\b")  # NRC suele venir 4-6 dígitos

# Match: "JU 14:00 A 15:40 ..." o "LU\n14:00 A 15:40 ..."
SLOT_RE = re.compile(
    r"\b(LU|MA|MI|JU|VI|SA)\b\s*[\r\n ]*\s*(\d{2}:\d{2})\s*A\s*(\d{2}:\d{2})",
    re.IGNORECASE
)

def time_to_block(start: str, end: str) -> List[int]:
    blocks: List[int] = []
    for idx, bstart, bend in UNAB_BLOCKS:
        if start == bstart and end == bend:
            blocks.append(idx)
    if not blocks:
        # fallback: si calza por inicio
        for idx, bstart, _ in UNAB_BLOCKS:
            if start == bstart:
                blocks.append(idx)
    return blocks

def parse_meetings(schedule_raw: str) -> List[Dict[str, Any]]:
    if not schedule_raw:
        return []
    meetings: List[Dict[str, Any]] = []
    for m in SLOT_RE.finditer(schedule_raw):
        day = m.group(1).upper()
        start = m.group(2)
        end = m.group(3)
        if day not in DAY_MAP:
            continue
        blocks = time_to_block(start, end)
        if not blocks:
            continue
        meetings.append({"day": DAY_MAP[day], "blocks": blocks})
    # merge por día (si aparecen varios slots mismo día)
    merged: Dict[str, set] = {}
    for x in meetings:
        merged.setdefault(x["day"], set()).update(x["blocks"])
    return [{"day": d, "blocks": sorted(list(bs))} for d, bs in merged.items()]

def extract_tables_all_pages(pdf_path: str) -> List[List[str]]:
    rows: List[List[str]] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_i, page in enumerate(pdf.pages):
            # intenta extraer todas las tablas de la página
            tables = page.extract_tables()
            if not tables:
                continue
            for t in tables:
                if not t:
                    continue
                for r in t:
                    if not r:
                        continue
                    # normaliza celdas
                    cleaned = [(c or "").strip() for c in r]
                    # filtro básico: evita encabezados repetidos
                    joined = " ".join(cleaned).upper()
                    if "NRC" in joined and "CODIGO" in joined and "HORARIO" in joined:
                        continue
                    rows.append(cleaned)
    return rows

def guess_columns(row: List[str]) -> Optional[Dict[str, str]]:
    """
    Intenta mapear columnas típicas del PDF:
    NRC | NRC LIGADOS | TIPO ACTIVIDAD | CODIGO | SECCION | TITULO | VACANTES | PROFESOR | HORARIO | MODALIDAD
    """
    # Si la fila es muy corta, probablemente no es válida
    if len(row) < 6:
        return None

    # Heurística: muchos PDFs UNAB vienen con ~10 columnas
    # pero a veces se “corre” por celdas vacías. Intentamos de forma tolerante.
    # Asumimos que:
    # - NRC está al inicio
    # - CODIGO aparece cerca del inicio
    # - HORARIO y MODALIDAD cerca del final
    # Vamos a usar posiciones preferidas si hay 10+
    if len(row) >= 10:
        return {
            "nrc": row[0],
            "linked": row[1],
            "activity": row[2],
            "code": row[3],
            "section": row[4],
            "title": row[5],
            "vacancies": row[6],
            "professor": row[7],
            "schedule": row[8],
            "modality": row[9],
        }

    # fallback: intenta por búsqueda del código (letras+números)
    code_idx = None
    for i, c in enumerate(row):
        if re.match(r"^[A-Z]{3,5}\d{3,4}$", c.strip().upper()):
            code_idx = i
            break
    if code_idx is None or code_idx < 1:
        return None

    # NRC al inicio
    nrc = row[0]
    linked = row[1] if len(row) > 1 else ""
    activity = row[2] if len(row) > 2 else ""
    code = row[code_idx]
    section = row[code_idx + 1] if code_idx + 1 < len(row) else ""
    title = row[code_idx + 2] if code_idx + 2 < len(row) else ""
    # schedule y modality suelen estar al final
    schedule = row[-2] if len(row) >= 2 else ""
    modality = row[-1] if len(row) >= 1 else ""

    # profesor/vacantes: si hay espacio los sacamos desde el medio
    vacancies = ""
    professor = ""
    if len(row) >= 8:
        vacancies = row[-4]
        professor = row[-3]

    return {
        "nrc": nrc,
        "linked": linked,
        "activity": activity,
        "code": code,
        "section": section,
        "title": title,
        "vacancies": vacancies,
        "professor": professor,
        "schedule": schedule,
        "modality": modality,
    }

def parse_int(s: str) -> Optional[int]:
    s = (s or "").strip()
    m = re.search(r"\d+", s)
    return int(m.group(0)) if m else None

def extract_linked_nrcs(linked_raw: str) -> List[str]:
    if not linked_raw:
        return []
    return NRC_RE.findall(linked_raw)

def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_unab_pdf.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    rows = extract_tables_all_pages(pdf_path)

    courses_by_code: Dict[str, Dict[str, Any]] = {}
    sections: List[Dict[str, Any]] = []

    rows_read = 0
    for r in rows:
        cols = guess_columns(r)
        if not cols:
            continue

        nrc = (cols["nrc"] or "").strip()
        code = (cols["code"] or "").strip().upper()
        title = (cols["title"] or "").strip()
        activity = (cols["activity"] or "").strip().upper()
        section_label = (cols["section"] or "").strip()
        professor = (cols["professor"] or "").strip()
        modality = (cols["modality"] or "").strip().upper()
        vacancies = parse_int(cols["vacancies"])
        schedule_raw = (cols["schedule"] or "").strip()
        linked_raw = (cols["linked"] or "").strip()

        if not nrc or not code:
            continue

        # course
        if code not in courses_by_code:
            courses_by_code[code] = {"id": code, "code": code, "name": title or code}

        meetings = parse_meetings(schedule_raw)

        sid = f"NRC-{nrc}"
        sections.append({
            "id": sid,
            "nrc": nrc,
            "courseId": code,
            "sectionLabel": section_label,
            "activityType": activity,
            "professor": professor,
            "modality": modality,
            "vacancies": vacancies,
            "linkedNrcRaw": linked_raw,
            "linkedNrcs": extract_linked_nrcs(linked_raw),  # <-- clave
            "scheduleRaw": schedule_raw,
            "meetings": meetings,
        })
        rows_read += 1

    # --- LIGADO: TEO -> TAL (y TAL -> TEO) ---
    # Regla práctica: si una sección es TEO y tiene linkedNrcs => esas NRC son actividades ligadas (TAL/LAB)
    teo_by_nrc: Dict[str, Dict[str, Any]] = {}
    sec_by_nrc: Dict[str, Dict[str, Any]] = {}

    for s in sections:
        sec_by_nrc[s["nrc"]] = s
        if s.get("activityType") == "TEO":
            teo_by_nrc[s["nrc"]] = s

    # reverse mapping: TAL/LAB apunta a qué TEO está ligado (si aparece en linkedNrcs de algún TEO)
    for teo_nrc, teo in teo_by_nrc.items():
        for lnrc in teo.get("linkedNrcs", []):
            target = sec_by_nrc.get(lnrc)
            if target:
                target["linkedToNrc"] = teo_nrc

    out = {
        "courses": list(courses_by_code.values()),
        "sections": sections,
        "rowsRead": rows_read,
        "rawRowsTotal": len(rows),
    }

    sys.stdout.write(json.dumps(out, ensure_ascii=False))

if __name__ == "__main__":
    main()
