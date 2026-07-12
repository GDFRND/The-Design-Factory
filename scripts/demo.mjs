// One-command local demo. Sets up config + a project-contained database,
// seeds the three demo brands, and starts the site.
//   Run:  npm run demo
// Requires only Node.js on the machine — the database downloads itself.
import { execSync, spawn } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";

function step(label, cmd) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { stdio: "inherit" });
}

if (!existsSync(".env")) {
  console.log("First run — creating .env from .env.demo (local defaults).");
  copyFileSync(".env.demo", ".env");
}

// The database may already be running from a previous `npm run demo`;
// that's fine — migrate/seed below will confirm it's actually reachable.
try {
  step("Starting the local database", "npm run db:start");
} catch {
  console.log("  (database already running — continuing)");
}

try {
  step("Applying the database schema", "npx prisma migrate deploy");
  step("Loading the three demo brands", "npm run seed");
} catch {
  console.error("\n✗ Setup failed. Make sure `npm install` finished first,");
  console.error("  then run `npm run demo` again.");
  process.exit(1);
}

console.log("\n✅ Ready. Open  http://localhost:3000  in your browser.");
console.log("   Press Ctrl+C here to stop the site.\n");

const dev = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
dev.on("exit", (code) => process.exit(code ?? 0));
