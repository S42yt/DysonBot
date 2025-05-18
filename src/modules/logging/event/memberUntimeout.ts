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

      if (!moduleConfig.events.memberUntimeout) return;

      // Check if this is a timeout being removed
      if (
        oldMember.isCommunicationDisabled() &&
        !newMember.isCommunicationDisabled()
      ) {
        const moduleEnv = configHandler.getModuleEnv("logging");
        const logChannelId = moduleEnv.logChannel;

        // Try to get who removed the timeout
        let moderator = "Unknown";

        try {
          const auditLogs = await newMember.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberUpdate,
            limit: 5,
          });

          const untimeoutLog = auditLogs.entries.find(
            entry =>
              entry.target?.id === newMember.id &&
              entry.changes.some(
                change =>
                  change.key === "communication_disabled_until" &&
                  change.new === null
              ) &&
              Date.now() - entry.createdTimestamp < 5000
          );

          if (untimeoutLog) {
            moderator = untimeoutLog.executor?.tag || "Unknown";
          }
        } catch (error) {
          Logger.error("Error fetching audit logs for untimeout:", error);
        }

        Logger.info(
          `Member timeout removed: ${newMember.user.tag} (${newMember.id}) by ${moderator}`
        );

        const embed = new EmbedBuilder()
          .setTitle("🔊 Member Timeout Removed")
          .setDescription(
            `<@${newMember.id}> (${newMember.user.tag}) has had their timeout removed.`
          )
          .addFields({ name: "Moderator", value: moderator, inline: true })
          .setColor("#4CD964")
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
      Logger.error("Error in memberUntimeout event:", error);
    }
  },
  "logging"
);
