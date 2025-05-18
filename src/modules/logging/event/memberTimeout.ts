import { AuditLogEvent, EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "guildMemberUpdate",
  async (oldMember, newMember) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.memberTimeout) return;

      if (
        !oldMember.isCommunicationDisabled() &&
        newMember.isCommunicationDisabled()
      ) {
        const moduleEnv = configHandler.getModuleEnv("logging");
        const logChannelId = moduleEnv.logChannel;

        let moderator = "Unknown";
        let reason = "No reason provided";

        try {
          const auditLogs = await newMember.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberUpdate,
            limit: 5,
          });

          const timeoutLog = auditLogs.entries.find(
            entry =>
              entry.target?.id === newMember.id &&
              entry.changes.some(
                change => change.key === "communication_disabled_until"
              ) &&
              Date.now() - entry.createdTimestamp < 5000
          );

          if (timeoutLog) {
            moderator = timeoutLog.executor?.tag || "Unknown";
            reason = timeoutLog.reason || reason;
          }
        } catch (error) {
          Logger.error("Error fetching audit logs for timeout:", error);
        }

        const timeoutEndTimestamp = Math.floor(
          newMember.communicationDisabledUntil!.getTime() / 1000
        );
        const timeoutDuration =
          newMember.communicationDisabledUntil!.getTime() - Date.now();
        const durationText = formatTimeoutDuration(timeoutDuration);

        Logger.info(
          `Member timed out: ${newMember.user.tag} (${newMember.id}) by ${moderator} for ${durationText}`
        );

        const embed = new EmbedBuilder()
          .setTitle("🔇 Member Timed Out")
          .setDescription(
            `<@${newMember.id}> (${newMember.user.tag}) has been timed out.`
          )
          .addFields(
            { name: "Duration", value: durationText, inline: true },
            {
              name: "Expires",
              value: `<t:${timeoutEndTimestamp}:R>`,
              inline: true,
            },
            { name: "Moderator", value: moderator, inline: true },
            { name: "Reason", value: reason, inline: false }
          )
          .setColor("#FF9500")
          .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
          .setTimestamp();

        const logChannel = newMember.client.channels.cache.get(
          logChannelId
        ) as TextChannel;
        if (logChannel) {
          await logChannel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      Logger.error("Error in memberTimeout event:", error);
    }
  },
  "logging"
);

function formatTimeoutDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours`;

  const days = Math.floor(hours / 24);
  return `${days} days`;
}
