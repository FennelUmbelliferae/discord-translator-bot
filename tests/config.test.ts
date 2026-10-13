import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createConfigStore } from "../src/config";
import type { Settings } from "../src/config";
import * as logger from "../src/logger";

const defaults: Settings = { selectedLanguages: ["JA", "KO"], skipTranslationPrefix: ";" };
let directory: string;
let previousPath: string | undefined;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "translator-config-"));
  previousPath = process.env.CONFIG_PATH;
  process.env.CONFIG_PATH = join(directory, "config.json");
});

afterEach(() => {
  if (previousPath === undefined) delete process.env.CONFIG_PATH;
  else process.env.CONFIG_PATH = previousPath;
  rmSync(directory, { recursive: true, force: true });
});

describe("config store", () => {
  test("missing file uses defaults without writing on read", () => {
    const store = createConfigStore();
    expect(store.read()).toEqual(defaults);
    expect(existsSync(process.env.CONFIG_PATH!)).toBe(false);
    expect(readdirSync(directory)).toEqual([]);
  });

  test("writes and reads a round-trip at CONFIG_PATH and leaves no temporary file", () => {
    const value: Settings = { selectedLanguages: ["FR", "JA"], skipTranslationPrefix: "//" };
    const store = createConfigStore();
    store.write({ ...value, selectedLanguages: [...value.selectedLanguages] });
    expect(createConfigStore().read()).toEqual(value);
    expect(JSON.parse(readFileSync(process.env.CONFIG_PATH!, "utf8"))).toEqual(value);
    expect(readdirSync(directory)).toEqual(["config.json"]);
  });

  test("creates the parent directory on first write", () => {
    process.env.CONFIG_PATH = join(directory, "nested", "config.json");
    const store = createConfigStore();
    expect(existsSync(join(directory, "nested"))).toBe(false);
    store.write({ selectedLanguages: [], skipTranslationPrefix: ";" });
    expect(createConfigStore().read().selectedLanguages).toEqual([]);
    expect(readdirSync(join(directory, "nested"))).toEqual(["config.json"]);
  });

  test.each(["{not JSON", '{"selectedLanguages":["INVALID"],"skipTranslationPrefix":";"}'])(
    "malformed file falls back to defaults without overwriting on read: %s",
    (contents) => {
      writeFileSync(process.env.CONFIG_PATH!, contents);
      const log = spyOn(logger, "error").mockImplementation(() => {});
      try {
        const store = createConfigStore();
        expect(store.read()).toEqual(defaults);
        expect(readFileSync(process.env.CONFIG_PATH!, "utf8")).toBe(contents);
        expect(log).toHaveBeenCalledTimes(1);
        store.write({ selectedLanguages: ["DE"], skipTranslationPrefix: "!" });
        expect(createConfigStore().read()).toEqual({
          selectedLanguages: ["DE"],
          skipTranslationPrefix: "!",
        });
      } finally {
        log.mockRestore();
      }
    },
  );
});
