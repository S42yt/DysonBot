import { Client, GatewayIntentBits, Collection } from "discord.js";
import { BotClient } from "./types/discord.js";
import Logger from "./utils/logger.js";

export default function createBotClient(): BotClient {
  Logger.info("Creating bot client...");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildExpressions,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildScheduledEvents,
      GatewayIntentBits.AutoModerationConfiguration,
      GatewayIntentBits.AutoModerationExecution,
    ],
  }) as BotClient;

  client.commands = new Collection();
  client.modules = new Collection();
  client.events = new Collection();

  client.on("error", error => {
    Logger.error("Discord client error:", error);
  });

  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      Logger.info(
        `Executing command: ${interaction.commandName} by ${interaction.user.tag}`
      );
      await command.execute(interaction);
      Logger.info(`Command ${interaction.commandName} executed successfully`);
    } catch (error) {
      Logger.error(
        `Error executing command ${interaction.commandName}:`,
        error
      );

      const errorMessage = "There was an error executing this command!";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  });

  return client;
}
