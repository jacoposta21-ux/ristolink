// Le pagine create in chat spesso contengono le foto "incorporate" come testo
// (data:image/...;base64,...): pesano molto e bloccano salvataggio e anteprima.
// Qui le carichiamo come file veri e le sostituiamo con il loro link.

const DATA_IMAGE = /data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+/g;
/** sotto questa dimensione (icone, loghi minuscoli) le lasciamo dove sono */
const MIN_CHARS = 8_000;

export function countInlineImages(html: string): number {
  return new Set((html.match(DATA_IMAGE) ?? []).filter((d) => d.length >= MIN_CHARS)).size;
}

export async function externalizeInlineImages(
  html: string,
  upload: (file: File) => Promise<string>,
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  const found = [...new Set((html.match(DATA_IMAGE) ?? []).filter((d) => d.length >= MIN_CHARS))];
  let out = html;
  for (let i = 0; i < found.length; i++) {
    onProgress?.(i, found.length);
    const dataUri = found[i];
    const blob = await (await fetch(dataUri)).blob();
    const ext = blob.type.split("/")[1]?.replace("svg+xml", "svg").replace("jpeg", "jpg") ?? "jpg";
    const url = await upload(new File([blob], `immagine-${i + 1}.${ext}`, { type: blob.type }));
    out = out.split(dataUri).join(url);
  }
  onProgress?.(found.length, found.length);
  return out;
}
