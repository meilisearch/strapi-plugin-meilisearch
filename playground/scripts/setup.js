#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const Database = require("better-sqlite3");

function ensureRestaurantPermission({ db, action, roleId }) {
  const existing = db
    .prepare(
      `
      SELECT p.id
      FROM up_permissions p
      JOIN up_permissions_role_lnk l ON l.permission_id = p.id
      WHERE p.action = ? AND l.role_id = ?
    `.trim(),
    )
    .get(action, roleId);

  if (existing?.id) {
    return existing.id;
  }

  const now = new Date().toISOString();
  const insertPermission = db.prepare(
    `
      INSERT INTO up_permissions (action, created_at, updated_at, published_at)
      VALUES (?, ?, ?, ?)
    `.trim(),
  );
  const permissionResult = insertPermission.run(action, now, now, now);

  db.prepare(
    `
      INSERT OR IGNORE INTO up_permissions_role_lnk (permission_id, role_id)
      VALUES (?, ?)
    `.trim(),
  ).run(permissionResult.lastInsertRowid, roleId);

  return permissionResult.lastInsertRowid;
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const tmpDir = path.join(root, ".tmp");
  const source = path.join(root, "pre-seeded-database.db");
  const destination = path.join(tmpDir, "data.db");
  const publicRoleId = 2;
  const restaurantActions = [
    "api::restaurant.restaurant.find",
    "api::restaurant.restaurant.findOne",
    "api::restaurant.restaurant.update",
    "api::restaurant.restaurant.delete",
  ];

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

  // Ensure public role can exercise restaurant CRUD needed for integration tests
  const db = new Database(destination);
  try {
    for (const action of restaurantActions) {
      ensureRestaurantPermission({ db, action, roleId: publicRoleId });
    }
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
