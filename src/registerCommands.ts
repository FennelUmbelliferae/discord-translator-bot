import { Client, Events } from "discord.js";

import { commands } from "./commands";
import { getDiscordToken } from "./env";
import { error, info } from "./logger";

async function main(): Promise<void> {
  const token = getDiscordToken();
  const client = new Client({ intents: 0 });
  try {
    const ready = new Promise<Client<true>>((resolve) => client.once(Events.ClientReady, resolve));
    await client.login(token);
    const readyClient = await ready;
    info(`Logged in as ${readyClient.user.tag}!`);
    await readyClient.application.commands.set(commands);
    info("registration succeed!");
  } finally {
    await client.destroy();
  }
}

main().catch((cause: unknown) => {
  error(cause);
  process.exitCode = 1;
});
