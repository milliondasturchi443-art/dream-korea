// Rasm faylini canvas orqali kichraytirib, JPEG data URLga aylantiramiz (server yengil qabul qilsin)
export const MAX_IMAGES = 3;
export const MAX_SIDE = 1024;

export async function fileToDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bmp.close(); throw new Error("canvas"); }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Tanlangan fayllarni data URLlarga aylantiradi; already — qancha rasm allaqachon tanlangan
export async function filesToDataUrls(files: FileList | null, already: number): Promise<{ images: string[]; error: string }> {
  if (!files?.length) return { images: [], error: "" };
  const room = MAX_IMAGES - already;
  if (room <= 0) return { images: [], error: `Ko'pi bilan ${MAX_IMAGES} ta rasm yuborish mumkin` };
  try {
    const out: string[] = [];
    for (const f of [...files].slice(0, room)) {
      if (!f.type.startsWith("image/")) continue;
      out.push(await fileToDataUrl(f));
    }
    if (!out.length) return { images: [], error: "Faqat rasm fayllari (JPG/PNG)" };
    return { images: out, error: "" };
  } catch {
    return { images: [], error: "Rasmni o'qib bo'lmadi — boshqa rasm tanlang" };
  }
}
