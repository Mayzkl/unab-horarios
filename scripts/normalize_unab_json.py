import sys
import json
from pathlib import Path

def decode_bytes(raw: bytes) -> str:
    # Detectores típicos
    if raw.startswith(b"\xff\xfe"):
        return raw.decode("utf-16le")
    if raw.startswith(b"\xfe\xff"):
        return raw.decode("utf-16be")

    # Preferimos utf-8-sig para tragarnos el BOM si existe
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        pass

    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        pass

    return raw.decode("latin-1", errors="replace")

def normalize_json(input_path: Path, output_path: Path, semester: str):
    if not input_path.exists():
        print(f"ERROR: input no existe: {input_path}", file=sys.stderr)
        sys.exit(2)

    raw_bytes = input_path.read_bytes()
    text = decode_bytes(raw_bytes).strip()

    # A veces viene con basura al inicio/fin; intento mínimo de limpiar
    if not text.startswith("{"):
        first = text.find("{")
        if first != -1:
            text = text[first:]

    raw = json.loads(text)

    courses = raw.get("courses", [])
    sections = raw.get("sections", [])

    # Relacionamos talleres (TAL) con sus secciones teóricas (TEO) usando `linkedNrcRaw`
    sections_by_nrc = {s['nrc']: s for s in sections}
    
    for section in sections:
        if "linkedNrcRaw" in section:
            linked_nrcs = section["linkedNrcRaw"].split(",")
            linked_sections = [
                sections_by_nrc.get(linked_nrc.strip()) 
                for linked_nrc in linked_nrcs if linked_nrc.strip() in sections_by_nrc
            ]
            section["linkedSections"] = linked_sections

    out = {
        "semesters": {
            semester: {
                "courseCount": len(courses),
                "sectionCount": len(sections),
            }
        },
        "courses": [
            {
                "id": c.get("id") or c.get("code"),
                "code": c.get("code") or c.get("id"),
                "name": (c.get("name") or "").title(),
                "semester": semester,
            }
            for c in courses
        ],
        "sections": [
            {
                "id": s.get("id"),
                "nrc": s.get("nrc"),
                "courseId": s.get("courseId"),
                "sectionLabel": s.get("sectionLabel"),
                "activityType": s.get("activityType"),
                "professor": s.get("professor"),
                "modality": s.get("modality"),
                "vacancies": s.get("vacancies"),
                "meetings": s.get("meetings", []),
                "scheduleRaw": s.get("scheduleRaw"),
                "linkedNrcRaw": s.get("linkedNrcRaw"),
                "linkedSections": s.get("linkedSections", []),
                "semester": semester,
            }
            for s in sections
        ],
        "meta": {
            "rowsRead": raw.get("rowsRead"),
            "rawRowsTotal": raw.get("rawRowsTotal"),
        }
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print("OK ")
    print("Input :", str(input_path))
    print("Output:", str(output_path))
    print(f"Courses: {len(out['courses'])} | Sections: {len(out['sections'])} | Semester: {semester}")

def main():
    if len(sys.argv) < 4:
        print("Usage: python normalize_unab_json.py <input_json> <output_json> <semester>", file=sys.stderr)
        sys.exit(1)

    input_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    semester = sys.argv[3]

    normalize_json(input_path, output_path, semester)

if __name__ == "__main__":
    main()
