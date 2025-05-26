import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";

class LeaveCommand {
  public readonly name = "leave";
  public readonly module = "admin";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Lässt den Bot den aktuellen Sprachkanal verlassen.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "Dieser Befehl kann nur auf einem Server verwendet werden."
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
            "Fehlende Berechtigung"
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply({
        embeds: [Embed.error("Konnte die Server-ID nicht abrufen.")],
      });
      return;
    }

    const connection = getVoiceConnection(guildId);

    if (!connection) {
      await interaction.editReply({
        embeds: [Embed.error("Der Bot ist derzeit in keinem Sprachkanal.")],
      });
      return;
    }

    try {
      connection.destroy();
      await interaction.editReply({
        embeds: [
          Embed.success("Der Bot hat den Sprachkanal erfolgreich verlassen."),
        ],
      });
      Logger.info(
        `Admin ${interaction.user.tag} used leave command. Bot left voice channel in guild ${guildId}`
      );
    } catch (error) {
      Logger.error("Error in leave command:", error);
      await interaction.editReply({
        embeds: [
          Embed.error(
            `Konnte den Sprachkanal nicht verlassen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
          ),
        ],
      });
    }
  }
}

export default new LeaveCommand();
