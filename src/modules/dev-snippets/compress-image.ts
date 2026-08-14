import { SNIPPET_IMAGE_MAX_CHARS } from "@/modules/dev-snippets/image";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1600;
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.45];

/**
 * Resize + JPEG-compress a picked or pasted file so it fits in the snippet row.
 */
export async function compressSnippetImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisis un fichier image (JPEG, PNG, GIF ou WebP).");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Fichier trop lourd (max 8 Mo).");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height, 1));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Impossible de lire l’image.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= SNIPPET_IMAGE_MAX_CHARS) return dataUrl;
    }
    throw new Error(
      "L’image est trop lourde même compressée. Choisis un fichier plus petit.",
    );
  } finally {
    bitmap.close();
  }
}
