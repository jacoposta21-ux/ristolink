"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "site-media";

/** Ridimensiona nel browser (max 1920px, WebP) prima del caricamento: siti più veloci. */
async function resize(file: File, max = 1920): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/webp", 0.82));
}

export async function uploadImage(clientId: string, file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const blob = await resize(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function ImageInput({ clientId, value, onChange, label, aspect = "aspect-video" }: {
  clientId: string;
  value: string;
  onChange: (url: string) => void;
  label: string;
  aspect?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <div className={`relative w-full overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 ${aspect}`}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="grid h-full w-full place-items-center text-sm text-neutral-500 hover:bg-neutral-100">
            <span className="flex flex-col items-center gap-1"><ImagePlus className="h-6 w-6" /> Carica foto</span>
          </button>
        )}
        {busy && <div className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        {value && !busy && (
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" onClick={() => ref.current?.click()} className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium shadow">Cambia</button>
            <button type="button" onClick={() => onChange("")} className="rounded-lg bg-white/90 p-1 text-red-600 shadow" aria-label="Rimuovi"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setError(null);
          try {
            onChange(await uploadImage(clientId, f));
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
