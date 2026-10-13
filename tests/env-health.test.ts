import { expect, test } from "bun:test";

import { getDiscordToken, getEnvironment } from "../src/env";
import { healthResponse } from "../src/health";

test("selects the production token only when NODE_ENV is production", () => {
  const env = { DISCORD_TOKEN: "production", DISCORD_TOKEN_TEST: "test", DEEPL_API_KEY: "key" };
  expect(getDiscordToken({ ...env, NODE_ENV: "production" })).toBe("production");
  expect(getDiscordToken({ ...env, NODE_ENV: "development" })).toBe("test");
  expect(getEnvironment(env)).toEqual({ discordToken: "test", deeplApiKey: "key", port: 3000 });
  expect(getEnvironment({ ...env, PORT: "4000" }).port).toBe(4000);
});

test("reports missing required environment variables clearly", () => {
  expect(() => getEnvironment({ NODE_ENV: "production" })).toThrow("DISCORD_TOKEN");
  expect(() => getEnvironment({})).toThrow("DISCORD_TOKEN_TEST");
  expect(() => getEnvironment({ DISCORD_TOKEN_TEST: "x" })).toThrow("DEEPL_API_KEY");
  expect(() => getEnvironment({ DISCORD_TOKEN_TEST: " ", DEEPL_API_KEY: "x" })).toThrow(
    "DISCORD_TOKEN_TEST",
  );
});

test("health returns exactly OK with 200 and other URLs return 404", async () => {
  const health = healthResponse(new Request("http://localhost/health"));
  expect(health.status).toBe(200);
  expect(health.headers.get("Content-Type")).toBe("text/plain");
  expect(await health.text()).toBe("OK");
  for (const path of ["/", "/health/", "/health?probe=1"]) {
    const response = healthResponse(new Request(`http://localhost${path}`));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  }
});
