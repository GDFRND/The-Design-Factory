// Local dev database: project-contained Postgres (no system install).
// Usage:  node scripts/dev-db.mjs start | stop
// Data lives in .pgdata/ (gitignored). Production uses Neon via
// DATABASE_URL; this exists so the app can run end-to-end locally.
import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: new URL("../.pgdata", import.meta.url).pathname,
  user: "tdf",
  password: "tdf",
  port: 5799,
  persistent: true,
});

const cmd = process.argv[2] ?? "start";

if (cmd === "start") {
  const fs = await import("node:fs");
  const fresh = !fs.existsSync(new URL("../.pgdata/PG_VERSION", import.meta.url).pathname);
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase("tdf");
  console.log("postgres ready on :5799 (db tdf, user tdf)");
} else if (cmd === "stop") {
  await pg.stop();
  console.log("postgres stopped");
} else {
  console.error("unknown command:", cmd);
  process.exit(1);
}
