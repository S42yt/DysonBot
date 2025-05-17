import {
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  CommandInteractionOptionResolver,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import { MemberStatusModel } from "../schema/memberStatus.js";
import {
  parseDuration,
  formatDuration,
} from "../../../utils/durationHandler.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

class AbmeldenCommand {
  public readonly name = "abmelden";
  public readonly module = "abmelden";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Markiere dich als abwesend")
    .addStringOption((option) =>
      option
        .setName("zeit")
        .setDescription("Wie lange wirst du abwesend sein (Format: 1d2h3m4s)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("grund")
        .setDescription("Grund für deine Abwesenheit")
        .setRequired(true)
    );

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
      const member = interaction.member as GuildMember;
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("abmelden");
      const clanRoleId = moduleEnv.role;

      if (!member.roles.cache.has(clanRoleId)) {
        await interaction.reply({
          embeds: [
            new Embed({
              title: "❌ Fehlende Berechtigung",
              description:
                "Du hast nicht die erforderliche Rolle, um diesen Befehl zu verwenden.",
              color: "#ED4245",
            }),
          ],
          ephemeral: true,
        });
        return;
      }

      const timeStr = (interaction.options as CommandInteractionOptionResolver).getString("zeit");
      const reason = (interaction.options as CommandInteractionOptionResolver).getString("grund") || undefined;

      if (!timeStr) {
        await interaction.reply({
          embeds: [
            new Embed({
              title: "❌ Fehlende Angabe",
              description: "Du musst eine Zeitdauer angeben.",
              color: "#ED4245",
            }),
          ],
          ephemeral: true,
        });
        return;
      }

      const duration = parseDuration(timeStr);
      if (!duration) {
        await interaction.reply({
          embeds: [
            new Embed({
              title: "❌ Ungültige Zeit",
              description:
                "Ungültiges Zeitformat. Bitte verwende das Format wie 1d2h3m4s (Tage, Stunden, Minuten, Sekunden).",
              color: "#ED4245",
            }),
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const endTime = new Date(Date.now() + duration);
      const formattedDuration = formatDuration(duration);

      let memberStatus = await MemberStatusModel.findOne({ userId: member.id });

      if (!memberStatus) {
        memberStatus = new MemberStatusModel({
          userId: member.id,
          displayName: member.displayName,
          username: member.user.username,
        });
      }

      memberStatus.status = "abgemeldet";
      memberStatus.reason = reason;
      memberStatus.endTime = endTime;
      memberStatus.displayName = member.displayName;
      memberStatus.username = member.user.username;

      await memberStatus.save();

      const embed = new Embed({
        title: "✅ Erfolgreich abgemeldet",
        description: `Du wurdest erfolgreich für ${formattedDuration} abgemeldet.`,
        color: "#43B581",
        fields: [
          {
            name: "⏱️ Rückkehr erwartet",
            value: endTime.toLocaleString("de-DE"),
            inline: true,
          },
          {
            name: "📝 Grund",
            value: reason ?? "Kein Grund angegeben",
            inline: true,
          },
        ],
        footer: {
          text: "Du kannst dich jederzeit mit /anmelden zurückmelden",
        },
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error("Error in abmelden command:", error);

      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [
            new Embed({
              title: "❌ Datenbankfehler",
              description:
                "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
              color: "#ED4245",
            }),
          ],
        });
      } else {
        await interaction.reply({
          embeds: [
            new Embed({
              title: "❌ Datenbankfehler",
              description:
                "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
              color: "#ED4245",
            }),
          ],
          ephemeral: true,
        });
      }
    }
  }
}

export default new AbmeldenCommand();
