import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test.each(["SIGINT", "SIGTERM"] as const)(
  "%s destroys Discord, stops HTTP and exits with status 0",
  async (signal) => {
    const directory = mkdtempSync(join(tmpdir(), "translator-shutdown-"));
    const log = join(directory, "lifecycle.log");
    const preload = join(directory, "preload.ts");
    // Keep the real entrypoint and signal handlers; replace the network endpoints only.
    await Bun.write(
      preload,
      `
import { Client } from ${JSON.stringify(import.meta.resolve("discord.js"))};
import { appendFileSync } from "node:fs";
const record = (value: string): void => appendFileSync(${JSON.stringify(log)}, value + "\\n");
Client.prototype.login = () => { record("login"); return new Promise(() => {}); };
Client.prototype.destroy = () => { record("destroy"); return Promise.resolve(); };
Bun.serve = ({ port }) => {
  const timer = setInterval(() => {}, 1000);
  record("serve");
  return { port, stop: () => { record("stop"); clearInterval(timer); return Promise.resolve(); } };
};
`,
    );
    const child = Bun.spawn({
      cmd: [process.execPath, "run", "--preload", preload, "src/index.ts"],
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        DISCORD_TOKEN: "x",
        DEEPL_API_KEY: "x",
        CONFIG_PATH: join(directory, "config.json"),
        PORT: "3000",
      },
      stdout: "pipe",
      stderr: "pipe",
    });
    const killTimer = setTimeout(() => child.kill("SIGKILL"), 4000);
    try {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        if (existsSync(log) && readFileSync(log, "utf8").includes("login\n")) break;
        if (child.exitCode !== null) break;
        await Bun.sleep(10);
      }
      if (child.exitCode !== null) {
        throw new Error(
          `exit=${child.exitCode}; stdout=${await new Response(child.stdout).text()}; stderr=${await new Response(child.stderr).text()}; log=${existsSync(log) ? readFileSync(log, "utf8") : "missing"}`,
        );
      }
      expect(existsSync(log) && readFileSync(log, "utf8").includes("login\n")).toBe(true);
      child.kill(signal);
      expect(await child.exited).toBe(0);
      expect(readFileSync(log, "utf8").trim().split("\n")).toEqual([
        "serve",
        "login",
        "destroy",
        "stop",
      ]);
      expect(await new Response(child.stdout).text()).toContain(
        "Health check server running on port 3000",
      );
      expect(await new Response(child.stderr).text()).toBe("");
    } finally {
      clearTimeout(killTimer);
      if (child.exitCode === null) {
        child.kill("SIGKILL");
        await child.exited;
      }
      rmSync(directory, { recursive: true, force: true });
    }
  },
  5000,
);
