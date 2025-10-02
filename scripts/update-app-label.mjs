#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "../src/config/app-info.json");

const args = process.argv.slice(2);
let label;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg.startsWith("--label=")) {
    label = arg.split("=")[1];
    break;
  }
  if (arg === "--label" && typeof args[i + 1] === "string") {
    label = args[i + 1];
    break;
  }
}

if (!label) {
  console.error("Error: Missing required option --label=<value>");
  process.exit(1);
}

const trimmedLabel = label.trim();
if (trimmedLabel.length === 0) {
  console.error("Error: Label cannot be empty.");
  process.exit(1);
}

let config;
try {
  const raw = readFileSync(configPath, "utf8");
  config = JSON.parse(raw);
} catch (error) {
  console.error(`Error reading config file at ${configPath}:`, error);
  process.exit(1);
}

config.sidebarLabel = trimmedLabel;

try {
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(`Sidebar label updated to "${trimmedLabel}".`);
} catch (error) {
  console.error(`Error writing config file at ${configPath}:`, error);
  process.exit(1);
}
