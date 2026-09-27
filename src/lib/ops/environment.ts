export type AtlasRuntimeEnv = "development" | "staging" | "production";

export function atlasRuntimeEnv(): AtlasRuntimeEnv {
  const explicit = (process.env.ATLAS_ENV || "").trim().toLowerCase();
  if (explicit === "staging" || explicit === "production" || explicit === "development") {
    return explicit;
  }
  const vercel = (process.env.VERCEL_ENV || "").trim().toLowerCase();
  if (vercel === "production") return "production";
  if (vercel === "preview" || vercel === "staging") return "staging";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

export function isProduction() {
  return atlasRuntimeEnv() === "production";
}
