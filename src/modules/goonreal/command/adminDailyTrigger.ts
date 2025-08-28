import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import { sendDailyGoonReminder } from "../event/dailyGoon.js";
import DailyGoonLog from "../schema/dailyGoonLog.js";

class AdminDailyTriggerCommand {
  public readonly name = "admindailytrigger";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(
      "Manually trigger the daily goon reminder (Admin)"
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

      const alreadySent = await DailyGoonLog.hasBeenSentToday(interaction.guild.id);
      if (alreadySent) {
        const todaysLog = await DailyGoonLog.getTodaysLog(interaction.guild.id);
        await interaction.editReply({
          embeds: [
            Embed.warning(
              `Daily Goon Reminder wurde heute bereits gesendet!\n\n` +
              `**Gesendet um:** ${todaysLog?.sentAt.toLocaleString()}\n` +
              `**Ausgelöst durch:** ${todaysLog?.triggeredBy === "manual" ? "Admin" : "Automatisch"}` +
              (todaysLog?.adminUserId ? `\n**Admin:** <@${todaysLog.adminUserId}>` : ""),
              "Bereits gesendet"
            ),
          ],
        });
        return;
      }

      const success = await sendDailyGoonReminder(
        interaction.client, 
        interaction.guild.id, 
        "manual", 
        interaction.user.id
      );
      
      if (!success) {
        await interaction.editReply({
          embeds: [
            Embed.error(
              "Fehler beim Senden des Daily Goon Reminders",
              "Fehler"
            ),
          ],
        });
        return;
      }

      await interaction.editReply({
        embeds: [
          Embed.success(
            "Das Daily Goon Reminder wurde erfolgreich gesendet!\n\n" +
            "**Info:** Der automatische Reminder für heute wurde dadurch deaktiviert. " +
            "Morgen wird wieder automatisch ein Reminder geplant.",
            "Manual ausgelöst"
          ),
        ],
      });

      Logger.info(
        `Daily goon reminder manually triggered by ${interaction.user.tag} in guild ${interaction.guild.name}`
      );
    } catch (error) {
      Logger.error("Error in admin daily trigger command:", error);
      await interaction.editReply({
        embeds: [
          Embed.error("Fehler beim Auslösen des Events", "Fehler"),
        ],
      });
    }
  }
}

export default new AdminDailyTriggerCommand();
