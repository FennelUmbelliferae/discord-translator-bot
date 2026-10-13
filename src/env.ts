import { z } from "zod";

export function getDiscordToken(env: NodeJS.ProcessEnv = process.env): string {
  const name = env.NODE_ENV === "production" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_TEST";
  const result = z.string().trim().min(1).safeParse(env[name]);
  if (!result.success) throw new Error(`Missing required environment variable: ${name}`);
  return result.data;
}

export function getEnvironment(env: NodeJS.ProcessEnv = process.env): {
  discordToken: string;
  deeplApiKey: string;
  port: number;
} {
  const discordToken = getDiscordToken(env);
  const key = z.string().trim().min(1).safeParse(env.DEEPL_API_KEY);
  if (!key.success) throw new Error("Missing required environment variable: DEEPL_API_KEY");
  const port = z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .safeParse(env.PORT || 3000);
  if (!port.success) throw new Error("PORT must be an integer between 1 and 65535");
  return { discordToken, deeplApiKey: key.data, port: port.data };
}
