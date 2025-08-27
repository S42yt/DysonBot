import {
  Client,
  GatewayIntentBits,
  Collection,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from "discord.js";
import { BotClient } from "./types/discord.js";
import Logger from "./utils/logger.js";
import { Embed } from "./types/embed.js";
import ConfigHandler from "./utils/configHandler.js";
import GoonStreak from "./modules/goonreal/schema/goonStreak.js";

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

  client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (
      interaction.customId === "goonreal_get" ||
      interaction.customId === "goonreal_remove"
    ) {
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("admin");
      const goonRealTimeRole = moduleEnv?.goonRealTimeRole;

      if (!goonRealTimeRole) {
        await interaction.reply({
          embeds: [
            Embed.error(
              "Die Goon Real Time Rolle ist nicht konfiguriert.",
              "Fehler"
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const member = await interaction.guild?.members.fetch(
        interaction.user.id
      );
      if (!member) {
        await interaction.reply({
          embeds: [
            Embed.error("Mitglied konnte nicht gefunden werden.", "Fehler"),
          ],
          ephemeral: true,
        });
        return;
      }

      if (interaction.customId === "goonreal_get") {
        if (member.roles.cache.has(goonRealTimeRole)) {
          await interaction.reply({
            embeds: [Embed.info("Du hast die Rolle bereits.", "Hinweis")],
            ephemeral: true,
          });
          return;
        }
        await member.roles.add(goonRealTimeRole);
        await interaction.reply({
          embeds: [Embed.success("Du hast die Rolle erhalten!", "Erfolg")],
          ephemeral: true,
        });
      } else if (interaction.customId === "goonreal_remove") {
        if (!member.roles.cache.has(goonRealTimeRole)) {
          await interaction.reply({
            embeds: [Embed.info("Du hast die Rolle nicht.", "Hinweis")],
            ephemeral: true,
          });
          return;
        }
        await member.roles.remove(goonRealTimeRole);
        await interaction.reply({
          embeds: [Embed.success("Rolle wurde entfernt.", "Erfolg")],
          ephemeral: true,
        });
      }
      return;
    }

    if (interaction.customId === "goon_submit") {
      const modal = new ModalBuilder()
        .setCustomId("goon_experience_modal")
        .setTitle("Goon Experience");

      const experienceInput = new TextInputBuilder()
        .setCustomId("goon_experience")
        .setLabel("Erzähl über deine Goon-Erfahrung")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Beschreibe deine heutige Goon-Session...")
        .setRequired(true)
        .setMaxLength(1000);

      const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        experienceInput
      );
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
      return;
    }

    // Handle quote pagination buttons
    if (interaction.customId.startsWith("goon_quotes_")) {
      const parts = interaction.customId.split("_");
      const action = parts[2]; // prev or next
      const currentPage = parseInt(parts[3]);
      const userId = parts[4];

      if (interaction.user.id !== userId) {
        await interaction.reply({
          embeds: [
            Embed.error(
              "Das ist nicht deine Quote-Liste!",
              "Zugriff verweigert"
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const userStreak = await GoonStreak.getUserStreak(
        userId,
        interaction.guildId!
      );
      if (!userStreak) return;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newPage = action === "next" ? currentPage + 1 : currentPage - 1;
    }

    if (interaction.customId.startsWith("admin_goon_quotes_")) {
      const parts = interaction.customId.split("_");
      const action = parts[3];
      const currentPage = parseInt(parts[4]);
      const targetUserId = parts[5];

      if (
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
      ) {
        await interaction.reply({
          embeds: [Embed.error("Keine Berechtigung", "Zugriff verweigert")],
          ephemeral: true,
        });
        return;
      }

      const userStreak = await GoonStreak.getUserStreak(
        targetUserId,
        interaction.guildId!
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const targetUser = await interaction.client.users.fetch(targetUserId);
      if (!userStreak) return;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newPage = action === "next" ? currentPage + 1 : currentPage - 1;
    }
  });

  client.on("interactionCreate", async interaction => {
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "goon_experience_modal"
    ) {
      try {
        await interaction.deferReply({ ephemeral: true });

        const experience =
          interaction.fields.getTextInputValue("goon_experience");
        const userStreak = await GoonStreak.updateStreak(
          interaction.user.id,
          interaction.guildId!,
          experience
        );

        await interaction.editReply({
          embeds: [
            Embed.success(
              `Deine Goon-Experience wurde gespeichert! Deine aktuelle Streak: **${userStreak.currentStreak}**`,
              "Experience gespeichert!"
            ),
          ],
        });
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "Already submitted today"
        ) {
          await interaction.editReply({
            embeds: [
              Embed.warning(
                "Du hast heute bereits deine Goon-Experience geteilt!",
                "Bereits eingereicht"
              ),
            ],
          });
        } else {
          Logger.error("Error saving goon experience:", error);
          await interaction.editReply({
            embeds: [
              Embed.error("Fehler beim Speichern der Experience", "Fehler"),
            ],
          });
        }
      }
    }
  });

  return client;
}
