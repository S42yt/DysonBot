import {
  CommandInteraction,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
} from "discord.js";
import { ModuleHandler } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import { BotClient } from "../../../types/discord.js";
import ConfigHandler from "../../../utils/configHandler.js";
import Logger from "../../../utils/logger.js";

class ReloadCommand {
  public readonly name = "reload";
  public readonly module = "admin";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Reload all modules and optionally configuration")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option
        .setName("config")
        .setDescription("Whether to also reload the configuration")
        .setRequired(false)
    );

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "You do not have permission to use this command.",
            "Permission Denied"
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const reloadConfig =
      (interaction.options as CommandInteractionOptionResolver).getBoolean(
        "config"
      ) || false;
    const client = interaction.client as BotClient;

    await interaction.deferReply({ ephemeral: true });

    try {
      const configHandler = ConfigHandler.getInstance();
      const results = [];

      if (reloadConfig) {
        try {
          configHandler.reloadConfig();
          results.push("✅ Configuration reloaded successfully");
          Logger.info("Configuration reloaded via admin command");
        } catch (error) {
          Logger.error("Failed to reload configuration:", error);
          results.push(
            `⚠️ Failed to reload configuration: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      try {
        const moduleHandler = new ModuleHandler(client);

        client.modules.forEach((_, moduleName) => {
          moduleHandler.unloadModule(moduleName);
        });

        await moduleHandler.loadAllModules();
        await moduleHandler.registerCommands();

        results.push("✅ All modules reloaded successfully");
        Logger.info("All modules reloaded via admin command");
      } catch (error) {
        Logger.error("Error reloading modules:", error);
        results.push(
          `⚠️ Failed to reload modules: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      const hasErrors = results.some((result) => result.includes("⚠️"));

      await interaction.editReply({
        embeds: [
          hasErrors
            ? Embed.warning(results.join("\n"), "Reload Partially Successful")
            : Embed.success(results.join("\n"), "Reload Successful"),
        ],
      });
    } catch (error) {
      Logger.error("Error in reload command:", error);

      await interaction.editReply({
        embeds: [
          Embed.error(
            `An error occurred while reloading: ${error instanceof Error ? error.message : String(error)}`,
            "Reload Failed"
          ),
        ],
      });
    }
  }
}

export default new ReloadCommand();
