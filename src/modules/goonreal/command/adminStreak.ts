import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import GoonStreak from "../schema/goonStreak.js";
import Logger from "../../../utils/logger.js";

class AdminGoonStreakCommand {
  public readonly name = "admingoonstreak";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Zeigt die Goon-Streak eines Benutzers an (Admin)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Der Benutzer dessen Streak angezeigt werden soll")
        .setRequired(true)
    );

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "Dieser Befehl kann nur in einem Server verwendet werden",
            "Fehler"
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
            "Du hast keine Berechtigung diesen Befehl zu verwenden",
            "Zugriff verweigert"
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser("user", true);
      const userStreak = await GoonStreak.getUserStreak(
        targetUser.id,
        interaction.guild.id
      );

      if (!userStreak || userStreak.quotes.length === 0) {
        await interaction.editReply({
          embeds: [
            Embed.info(
              `${targetUser.displayName} hat noch keine Goon-Streak.`,
              "Keine Streak gefunden"
            ),
          ],
        });
        return;
      }

      const lastQuote = userStreak.quotes[userStreak.quotes.length - 1];

      const embed = new Embed({
        title: `🔥 ${targetUser.displayName}'s Goon Streak: ${userStreak.currentStreak}`,
        description: lastQuote?.content || "Keine Beschreibung verfügbar",
        color: "#db3dff",
        thumbnail: targetUser.displayAvatarURL({ size: 256 }),
        footer: {
          text: `Admin View - ${targetUser.displayName}`,
        },
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error("Error in admin goon streak command:", error);
      await interaction.editReply({
        embeds: [Embed.error("Fehler beim Abrufen der Streak-Daten", "Fehler")],
      });
    }
  }
}

export default new AdminGoonStreakCommand();
