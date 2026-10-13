import { Client, Events, GatewayIntentBits } from "discord.js";

import { onInteraction, onMessage } from "./bot";
import { createConfigStore } from "./config";
import { getEnvironment } from "./env";
import { healthResponse } from "./health";
import { error, info } from "./logger";

async function main(): Promise<void> {
  const env = getEnvironment();
  const store = createConfigStore();
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  client.once(Events.ClientReady, (readyClient) => info(`Logged in as ${readyClient.user.tag}!`));
  client.on(Events.MessageCreate, (message) => {
    onMessage(message, store, env.deeplApiKey).catch((cause: unknown) => error(cause));
  });
  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isChatInputCommand()) {
      onInteraction(interaction, store, env.deeplApiKey).catch((cause: unknown) => error(cause));
    }
  });

  const server = Bun.serve({ port: env.port, fetch: healthResponse });
  info(`Health check server running on port ${server.port}`);
  let shuttingDown = false;
  async function shutdown(): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    await client.destroy();
    await server.stop();
    process.exit(0);
  }
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      shutdown().catch((cause: unknown) => error(cause));
    });
  }

  try {
    await client.login(env.discordToken);
  } catch (cause) {
    await client.destroy();
    await server.stop();
    throw cause;
  }
}

main().catch((cause: unknown) => {
  error(cause);
  process.exitCode = 1;
});
