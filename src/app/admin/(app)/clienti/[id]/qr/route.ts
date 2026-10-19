import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { tenantUrl } from "@/lib/env";

// QR code del sito del cliente (PNG ad alta risoluzione o SVG vettoriale).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: client } = await supabase.from("clients").select("slug, custom_domain").eq("id", id).maybeSingle();
  if (!client) return new Response("Cliente non trovato", { status: 404 });

  const url = tenantUrl(client.slug, client.custom_domain);
  const q = new URL(req.url).searchParams;
  const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } };
  const filename = `qr-${client.slug}`;
  const disposition = q.get("anteprima") ? "inline" : "attachment";

  if (q.get("formato") === "svg") {
    const svg = await QRCode.toString(url, { ...opts, type: "svg" });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `${disposition}; filename="${filename}.svg"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  }
  const png = await QRCode.toBuffer(url, { ...opts, type: "png", width: 1200 });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${disposition}; filename="${filename}.png"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
