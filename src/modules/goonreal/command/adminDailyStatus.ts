import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import DailyGoonLog from "../schema/dailyGoonLog.js";

class AdminDailyStatusCommand {
  public readonly name = "admindailystatus";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(
      "Zeigt an wann der nächste Daily Goon Reminder gesendet wird (Admin)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

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

      const now = new Date();
      const alreadySent = await DailyGoonLog.hasBeenSentToday(interaction.guild.id);
      const todaysLog = await DailyGoonLog.getTodaysLog(interaction.guild.id);
      const recentLogs = await DailyGoonLog.getRecentLogs(interaction.guild.id, 5);

      let statusDescription = "";

      if (alreadySent && todaysLog) {
        statusDescription += `**✅ Heute bereits gesendet:**\n`;
        statusDescription += `${todaysLog.sentAt.toLocaleString()}\n`;
        statusDescription += `Ausgelöst durch: ${todaysLog.triggeredBy === "manual" ? "Admin" : "Automatisch"}\n`;
        if (todaysLog.adminUserId) {
          statusDescription += `Admin: <@${todaysLog.adminUserId}>\n\n`;
        } else {
          statusDescription += "\n";
        }
        statusDescription += `**📅 Nächster Reminder:** Morgen (automatisch geplant um 8:00 Uhr)\n\n`;
      } else {
        const nextScheduler = new Date(now);
        nextScheduler.setHours(8, 0, 0, 0);
        if (now.getHours() >= 8) {
          nextScheduler.setDate(nextScheduler.getDate() + 1);
        }

        statusDescription += `**⏰ Status:** Noch nicht gesendet heute\n`;
        statusDescription += `**📅 Nächster Scheduler:** ${nextScheduler.toLocaleString()}\n`;
        statusDescription += `**🎲 Zufällige Zeit:** Zwischen 8:00 - 23:59 Uhr\n\n`;
      }

      if (recentLogs.length > 0) {
        statusDescription += `**📊 Letzte 5 Reminder:**\n`;
        recentLogs.forEach(log => {
          const emoji = log.triggeredBy === "manual" ? "🔧" : "🤖";
          statusDescription += `${emoji} ${log.date.toLocaleDateString()} - ${log.triggeredBy}\n`;
        });
      }

      const embed = new Embed({
        title: "📅 Daily Goon Reminder Status",
        description: statusDescription,
        color: alreadySent ? "#00ff00" : "#db3dff",
        timestamp: true,
        footer: {
          text: `Status abgerufen von ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL(),
        },
      });

      await interaction.editReply({ embeds: [embed] });

      Logger.info(
        `Daily goon status checked by ${interaction.user.tag} in guild ${interaction.guild.name}`
      );
    } catch (error) {
      Logger.error("Error in admin daily status command:", error);
      await interaction.editReply({
        embeds: [
          Embed.error("Fehler beim Abrufen des Status", "Fehler"),
        ],
      });
    }
  }
}

export default new AdminDailyStatusCommand();