export const MAX_VAULT_FILE_BYTES = 900_000;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isDataUrl(content: string): boolean {
  return content.startsWith("data:");
}

export function dataUrlMime(content: string): string | null {
  const match = content.match(/^data:([^;]+);/);
  return match?.[1] ?? null;
}

export async function readFileForVault(
  file: File,
  maxBytes = MAX_VAULT_FILE_BYTES,
): Promise<
  | { ok: true; content: string; fileName: string; mimeType: string; sizeBytes: number }
  | { ok: false; error: string }
> {
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `File is ${formatFileSize(file.size)} — demo vault max is ${formatFileSize(maxBytes)}.`,
    };
  }

  const mimeType = file.type || "application/octet-stream";
  const isText =
    mimeType.startsWith("text/") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".md");

  if (isText) {
    try {
      const text = await file.text();
      return {
        ok: true,
        content: text,
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
      };
    } catch {
      return { ok: false, error: "Could not read that text file." };
    }
  }

  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  if (!dataUrl) {
    return { ok: false, error: "Could not read that file." };
  }

  return {
    ok: true,
    content: dataUrl,
    fileName: file.name,
    mimeType,
    sizeBytes: file.size,
  };
}
