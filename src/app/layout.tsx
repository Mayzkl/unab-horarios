import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNAB Horarios",
  description: "Generador interactivo de horarios universitarios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
