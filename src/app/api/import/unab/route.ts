import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { spawn } from "child_process";

export const runtime = "nodejs"; // importante (no edge)

function runPythonParser(pdfPath: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "parse_unab_pdf.py"
    );

    const venvPython = path.join(
      process.cwd(),
      "venv",
      "Scripts",
      "python.exe"
    );

    const py = spawn(venvPython, [scriptPath, pdfPath]);

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(err || `Parser failed (${code})`));
      }
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(
          new Error("No se pudo parsear el JSON del parser.\n" + out)
        );
      }
    });
  });
}


export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo PDF (file)" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const tmpDir = path.join(process.cwd(), ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const filename = `${randomUUID()}.pdf`;
  const pdfPath = path.join(tmpDir, filename);
  await fs.writeFile(pdfPath, bytes);

  const parsed = await runPythonParser(pdfPath);

  return NextResponse.json(parsed);
}
