import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import GoonStreak from "../schema/goonStreak.js";
import Logger from "../../../utils/logger.js";

class AdminGoonQuotesCommand {
  public readonly name = "admingoonquotes";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Zeigt die Goon-Zitate eines Benutzers an (Admin)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Der Benutzer dessen Zitate angezeigt werden sollen")
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
              `${targetUser.displayName} hat noch keine Goon-Zitate.`,
              "Keine Zitate gefunden"
            ),
          ],
        });
        return;
      }

      await this.showQuotePage(interaction, userStreak, targetUser, 0);
    } catch (error) {
      Logger.error("Error in admin goon quotes command:", error);
      await interaction.editReply({
        embeds: [Embed.error("Fehler beim Abrufen der Zitat-Daten", "Fehler")],
      });
    }
  }

  private async showQuotePage(
    interaction: ChatInputCommandInteraction,
    userStreak: { quotes: { content: string; date: Date }[] },
    targetUser: { displayName: string; id: string },
    page: number
  ) {
    const quotes = [...userStreak.quotes].reverse();
    const quote = quotes[page];

    if (!quote) return;

    const embed = new Embed({
      title: `📝 ${targetUser.displayName}'s Goon Quote ${page + 1}/${quotes.length}`,
      description: quote.content,
      color: "#db3dff",
      footer: {
        text: `${quote.date.toLocaleDateString()} - Admin View`,
      },
    });

    const row = new ActionRowBuilder<ButtonBuilder>();

    if (page > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`admin_goon_quotes_prev_${page}_${targetUser.id}`)
          .setLabel("← Vorherige")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (page < quotes.length - 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`admin_goon_quotes_next_${page}_${targetUser.id}`)
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

export default new AdminGoonQuotesCommand();
