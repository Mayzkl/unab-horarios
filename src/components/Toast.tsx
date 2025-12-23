"use client";

type Props = {
  message: string | null;
  type?: "error" | "info";
  onClose: () => void;
};

export default function Toast({ message, type = "info", onClose }: Props) {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={[
          "min-w-[280px] max-w-[420px] rounded-2xl border p-4 shadow-lg",
          type === "error"
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-white border-zinc-200 text-zinc-900",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="text-sm leading-5">{message}</div>
          <button
            onClick={onClose}
            className="ml-auto text-zinc-500 hover:text-zinc-900 text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
