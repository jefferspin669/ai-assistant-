/** Drizzle Kit config placeholder. Install drizzle-kit + drizzle-orm before generating migrations. */
export default {
  schema: "./src/lib/db/drizzle-schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_URL || "file:./.data/atlas.sqlite" },
};
