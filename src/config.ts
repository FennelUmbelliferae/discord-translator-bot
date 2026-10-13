import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

import { z } from "zod";

import { LANGUAGE_CODES } from "./languages";
import { error } from "./logger";

export const settingsSchema = z.object({
  selectedLanguages: z.array(z.enum(LANGUAGE_CODES)).default(["JA", "KO"]),
  // 空文字は全メッセージに一致して翻訳がすべて止まるので、不正な設定として既定値に戻す
  skipTranslationPrefix: z.string().min(1).default(";"),
});

export type Settings = z.infer<typeof settingsSchema>;

export interface ConfigStore {
  read(): Settings;
  write(settings: Settings): void;
}

export function createConfigStore(
  path = process.env.CONFIG_PATH ?? "data/config.json",
): ConfigStore {
  let settings = settingsSchema.parse({});
  if (existsSync(path)) {
    try {
      settings = settingsSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    } catch (cause) {
      error(`Failed to load configuration from ${path}:`, cause);
    }
  }

  return {
    read(): Settings {
      return structuredClone(settings);
    },
    write(value: Settings): void {
      const next = settingsSchema.parse(value);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
      try {
        writeFileSync(temporary, JSON.stringify(next, null, 2), { flag: "wx" });
        renameSync(temporary, path);
        settings = next;
      } finally {
        if (existsSync(temporary)) unlinkSync(temporary);
      }
    },
  };
}
