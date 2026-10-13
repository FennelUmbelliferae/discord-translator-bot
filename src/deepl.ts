import { z } from "zod";

import type { LanguageCode } from "./languages";

const usageSchema = z.object({ character_count: z.number(), character_limit: z.number() });
const translationSchema = z.object({
  translations: z.array(z.object({ text: z.string() })).min(1),
});

export type DeepLUsage = z.infer<typeof usageSchema>;

async function request(
  endpoint: "translate" | "usage",
  apiKey: string,
  body: URLSearchParams,
  fetcher: typeof fetch,
): Promise<unknown> {
  const response = await fetcher(`https://api-free.deepl.com/v2/${endpoint}`, {
    method: "POST",
    headers: {
      // Body authentication is deprecated for all endpoints: https://developers.deepl.com/docs/resources/breaking-changes-change-notices/november-2025-deprecation-of-legacy-auth-methods
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) throw new Error(`DeepL ${endpoint} failed: HTTP ${response.status}`);
  return response.json();
}

export async function translateText(
  apiKey: string,
  text: string,
  language: LanguageCode,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<string> {
  const result = translationSchema.parse(
    await request(
      "translate",
      apiKey,
      new URLSearchParams({ text, target_lang: language }),
      fetcher,
    ),
  );
  return result.translations[0]!.text;
}

export async function getDeepLLimit(
  apiKey: string,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<DeepLUsage> {
  return usageSchema.parse(await request("usage", apiKey, new URLSearchParams(), fetcher));
}
