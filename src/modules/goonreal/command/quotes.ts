import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import GoonStreak from "../schema/goonStreak.js";
import Logger from "../../../utils/logger.js";

class GoonQuotesCommand {
  public readonly name = "goonquotes";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Zeigt deine Goon-Zitate an");

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

      if (!userStreak || !userStreak.quotes || userStreak.quotes.length === 0) {
        await interaction.editReply({
          embeds: [
            Embed.info(
              "Du hast noch keine Goon-Zitate. Verwende den täglichen Button um anzufangen!",
              "Keine Zitate gefunden"
            ),
          ],
        });
        return;
      }

      await this.showQuotePage(interaction, userStreak, 0);
    } catch (error) {
      Logger.error("Error in goon quotes command:", error);
      await interaction.editReply({
        embeds: [Embed.error("Fehler beim Abrufen der Zitat-Daten", "Fehler")],
      });
    }
  }

  private async showQuotePage(
    interaction: ChatInputCommandInteraction,
    userStreak: { quotes: { content: string; date: Date }[] },
    page: number
  ) {
    const quotes = [...userStreak.quotes].reverse();
    const quote = quotes[page];

    if (!quote) return;

    const embed = new Embed({
      title: `📝 Goon Quote ${page + 1}/${quotes.length}`,
      description: quote.content,
      color: "#db3dff",
      footer: {
        text: `${new Date(quote.date).toLocaleDateString()} - ${interaction.user.displayName}`,
      },
    });

    const row = new ActionRowBuilder<ButtonBuilder>();

    if (page > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`goon_quotes_prev_${page}_${interaction.user.id}`)
          .setLabel("← Vorherige")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (page < quotes.length - 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`goon_quotes_next_${page}_${interaction.user.id}`)
          .setLabel("Nächste →")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const components = row.components.length > 0 ? [row] : [];

    await interaction.editReply({
      embeds: [embed],
      components,
    });
  }
}

export default new GoonQuotesCommand();
