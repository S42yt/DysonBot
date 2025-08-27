import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Embed } from "../../../types/embed.js";
import GoonStreak from "../schema/goonStreak.js";
import Logger from "../../../utils/logger.js";

class GoonStreakCommand {
  public readonly name = "goonstreak";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Zeigt deine aktuelle Goon-Streak an");

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

    try {
      await interaction.deferReply({ ephemeral: true });

      const userStreak = await GoonStreak.getUserStreak(
        interaction.user.id,
        interaction.guild.id
      );

      if (!userStreak || userStreak.quotes.length === 0) {
        await interaction.editReply({
          embeds: [
            Embed.info(
              "Du hast noch keine Goon-Streak. Verwende den täglichen Button um anzufangen!",
              "Keine Streak gefunden"
            ),
          ],
        });
        return;
      }

      const lastQuote = userStreak.quotes[userStreak.quotes.length - 1];

      const embed = new Embed({
        title: `🔥 Deine Goon Streak: ${userStreak.currentStreak}`,
        description: lastQuote?.content || "Keine Beschreibung verfügbar",
        color: "#db3dff",
        thumbnail: interaction.user.displayAvatarURL({ size: 256 }),
        footer: {
          text: interaction.user.displayName,
        },
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error("Error in goon streak command:", error);
      await interaction.editReply({
        embeds: [Embed.error("Fehler beim Abrufen der Streak-Daten", "Fehler")],
      });
    }
  }
}

export default new GoonStreakCommand();
