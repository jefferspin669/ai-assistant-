#!/usr/bin/env node
/**
 * Build a static site for GitHub Pages.
 *
 * API Route Handlers and middleware are not supported with `output: "export"`.
 * The UI already uses the client-side atlas-api + localStorage, so we temporarily
 * move those server-only pieces aside for the Pages build, then restore them.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "src/app/api");
const apiPark = join(root, ".pages-build-stash/api");
const middlewareFile = join(root, "src/middleware.ts");
const middlewarePark = join(root, ".pages-build-stash/middleware.ts");
const stashRoot = join(root, ".pages-build-stash");
const outDir = join(root, "out");
const docsDir = join(root, "docs");

function run(cmd, args, env = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with code ${result.status}`);
  }
}

function park(src, dest) {
  if (!existsSync(src)) return false;
  mkdirSync(join(dest, ".."), { recursive: true });
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  renameSync(src, dest);
  return true;
}

function restore(src, dest) {
  if (!existsSync(src)) return;
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  renameSync(src, dest);
}

let parkedApi = false;
let parkedMiddleware = false;

try {
  mkdirSync(stashRoot, { recursive: true });
  parkedApi = park(apiDir, apiPark);
  parkedMiddleware = park(middlewareFile, middlewarePark);

  rmSync(outDir, { recursive: true, force: true });
  run("npx", ["next", "build"], { GITHUB_PAGES: "true" });

  if (!existsSync(outDir)) {
    throw new Error("Expected ./out after static export");
  }

  rmSync(docsDir, { recursive: true, force: true });
  mkdirSync(docsDir, { recursive: true });
  cpSync(outDir, docsDir, { recursive: true });
  // Prevent Jekyll from ignoring the `_next` asset folder on GitHub Pages.
  writeFileSync(join(docsDir, ".nojekyll"), "");
  console.log("GitHub Pages build ready in ./docs");
} finally {
  if (parkedApi) restore(apiPark, apiDir);
  if (parkedMiddleware) restore(middlewarePark, middlewareFile);
  rmSync(stashRoot, { recursive: true, force: true });
}
