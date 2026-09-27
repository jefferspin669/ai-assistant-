#!/usr/bin/env node
/**
 * CI gate: internal app links in src/ must point at known App Router pages
 * or be external/hash/mailto. Catches broken /app navigation.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const appDir = resolve(root, "src/app");
const srcDir = resolve(root, "src");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "docs") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mdx?)$/.test(name)) out.push(full);
  }
  return out;
}

/** Collect routes from App Router page files under src/app. */
function collectRoutes(dir, base = "") {
  const routes = new Set(["/", "/app"]);
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name.startsWith("(") && name.endsWith(")")) {
        collectRoutes(full, base).forEach((r) => routes.add(r));
      } else if (name.startsWith("[")) {
        routes.add(`${base}/${name}`);
        collectRoutes(full, `${base}/${name}`).forEach((r) => routes.add(r));
      } else {
        collectRoutes(full, `${base}/${name}`).forEach((r) => routes.add(r));
      }
    } else if (name === "page.tsx" || name === "page.ts" || name === "page.jsx") {
      routes.add(base || "/");
    }
  }
  return routes;
}

const routes = collectRoutes(appDir);
const staticRoutes = [...routes].filter((r) => !r.includes("["));

function routeExists(pathname) {
  const clean = pathname.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  if (staticRoutes.includes(clean)) return true;
  if (staticRoutes.includes(pathname)) return true;
  for (const route of routes) {
    if (!route.includes("[")) continue;
    const pattern = "^" + route.replace(/\[[^\]]+\]/g, "[^/]+") + "$";
    if (new RegExp(pattern).test(clean)) return true;
  }
  if (clean.startsWith("/api/")) return true;
  return false;
}

const linkRe =
  /(?:href|to|router\.(?:push|replace)|redirect)\(\s*[`'"](\/[^`'"]+)[`'"]|href=\{?[`'"](\/[^`'"]+)[`'"]/g;
const hrefAttrRe = /href=["'](\/[^"']+)["']/g;

const files = walk(srcDir);
const broken = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const found = new Set();
  for (const re of [linkRe, hrefAttrRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const path = m[1] || m[2];
      if (!path || !path.startsWith("/")) continue;
      if (path.startsWith("//")) continue;
      if (path.startsWith("/_next")) continue;
      if (path.includes("${")) continue;
      found.add(path.split("?")[0]);
    }
  }
  for (const path of found) {
    if (!routeExists(path)) {
      broken.push({ file: relative(root, file), path });
    }
  }
}

if (broken.length) {
  console.error(`[atlas:links] ${broken.length} internal link(s) missing a page:`);
  for (const row of broken.slice(0, 50)) {
    console.error(`  ${row.path}  ←  ${row.file}`);
  }
  process.exit(1);
}

console.log(`[atlas:links] ok — checked ${files.length} files against ${staticRoutes.length} routes`);
