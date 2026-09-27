import { z } from "zod";

const optionalSecret = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    ATLAS_APP_USER: z.string().trim().min(1).default("atlas"),
    ATLAS_APP_PASSWORD: optionalSecret,
    NEXT_PUBLIC_BASE_PATH: optionalSecret,
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && value.ATLAS_APP_PASSWORD.length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ATLAS_APP_PASSWORD"],
        message: "ATLAS_APP_PASSWORD must be at least 16 characters in production.",
      });
    }
  });

export type AtlasEnv = z.infer<typeof envSchema>;

let cached: AtlasEnv | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AtlasEnv {
  const parsed = envSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    ATLAS_APP_USER: source.ATLAS_APP_USER,
    ATLAS_APP_PASSWORD: source.ATLAS_APP_PASSWORD,
    NEXT_PUBLIC_BASE_PATH: source.NEXT_PUBLIC_BASE_PATH,
  });
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid environment: ${detail}`);
  }
  return parsed.data;
}

export function getEnv(): AtlasEnv {
  if (!cached) cached = loadEnv();
  return cached;
}

export function resetEnvCache() {
  cached = null;
}
