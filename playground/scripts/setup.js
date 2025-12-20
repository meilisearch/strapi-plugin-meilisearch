#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const root = path.resolve(__dirname, "..");
  const tmpDir = path.join(root, ".tmp");
  const source = path.join(root, "pre-seeded-database.db");
  const destination = path.join(tmpDir, "data.db");

  // Check if source database exists
  try {
    await fs.access(source);
  } catch {
    throw new Error(`Pre-seeded database not found at: ${source}`);
  }

  // Create the .tmp directory if it doesn't exist
  await fs.mkdir(tmpDir, { recursive: true });
  // Copy the pre-seeded database to the .tmp directory
  await fs.copyFile(source, destination);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
