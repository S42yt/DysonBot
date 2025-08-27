import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import { sendDailyGoonReminder, scheduleNextGoon } from "../event/dailyGoon.js";

class AdminDailyTriggerCommand {
  public readonly name = "admindailytrigger";
  public readonly module = "goonreal";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(
      "Manually trigger the daily goon reminder event and reset timer (Admin)"
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

      const success = await sendDailyGoonReminder(interaction.client);

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

      await scheduleNextGoon(interaction.client);

      await interaction.editReply({
        embeds: [
          Embed.success(
            "Das Daily Goon Reminder wurde erfolgreich gesendet und der Timer neu gesetzt.",
            "Event ausgelöst"
          ),
        ],
      });

      Logger.info(
        `Daily goon reminder manually sent and rescheduled by ${interaction.user.tag} in guild ${interaction.guild.name}.`
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
