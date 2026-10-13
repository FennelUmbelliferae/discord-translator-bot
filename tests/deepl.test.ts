import { afterAll, afterEach, expect, spyOn, test } from "bun:test";

import { getDeepLLimit, translateText } from "../src/deepl";

const fetchMock = spyOn(globalThis, "fetch");
afterEach(() => fetchMock.mockReset());
afterAll(() => fetchMock.mockRestore());

test("translation uses Authorization and form encoding without auth_key", async () => {
  fetchMock.mockResolvedValue(Response.json({ translations: [{ text: "こんにちは" }] }));
  expect(await translateText("secret", "hello & + 世界", "JA")).toBe("こんにちは");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe("https://api-free.deepl.com/v2/translate");
  expect(init?.method).toBe("POST");
  const headers = new Headers(init?.headers);
  expect(headers.get("Authorization")).toBe("DeepL-Auth-Key secret");
  expect(headers.get("Content-Type")).toBe("application/x-www-form-urlencoded");
  const body = new URLSearchParams(String(init?.body));
  expect(body.get("text")).toBe("hello & + 世界");
  expect(body.get("target_lang")).toBe("JA");
  expect(body.has("auth_key")).toBe(false);
  expect([...body.keys()]).toEqual(["text", "target_lang"]);
});

test("usage uses Authorization without auth_key in the body", async () => {
  fetchMock.mockResolvedValue(Response.json({ character_count: 1, character_limit: 500000 }));
  expect(await getDeepLLimit("secret")).toEqual({ character_count: 1, character_limit: 500000 });
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe("https://api-free.deepl.com/v2/usage");
  expect(init?.method).toBe("POST");
  expect(new Headers(init?.headers).get("Authorization")).toBe("DeepL-Auth-Key secret");
  expect(new URLSearchParams(String(init?.body)).has("auth_key")).toBe(false);
});

test("rejects HTTP errors so the caller can send the existing error reply", async () => {
  fetchMock.mockResolvedValue(new Response("quota", { status: 456 }));
  await expect(translateText("secret", "hello", "JA")).rejects.toThrow("HTTP 456");
});
