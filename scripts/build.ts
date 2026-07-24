import { $ } from "bun";
import * as fs from "fs";

await $`bun build src/index.ts --outdir=dist --target=node --minify --sourcemap`;

// Normalize paths in the sourcemap to use forward slashes.
// This prevents "dist is out of date" CI errors when building on Windows and verifying on Linux.
const mapPath = "dist/index.js.map";
if (fs.existsSync(mapPath)) {
  const mapContent = fs.readFileSync(mapPath, "utf8");
  const map = JSON.parse(mapContent);
  if (map.sources) {
    map.sources = map.sources.map((s: string) => s.split("\\\\").join("/"));
    fs.writeFileSync(mapPath, JSON.stringify(map));
  }
}
