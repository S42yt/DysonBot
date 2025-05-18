import { AuditLogEvent, EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "guildBanRemove",
  async ban => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.memberUnban) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      const { guild, user } = ban;

      let moderator = "Unknown";
      let reason = "No reason provided";

      try {
        const auditLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.MemberBanRemove,
          limit: 1,
        });

        const unbanLog = auditLogs.entries.first();
        if (
          unbanLog &&
          unbanLog.target?.id === user.id &&
          Date.now() - unbanLog.createdTimestamp < 5000
        ) {
          moderator = unbanLog.executor?.tag || "Unknown";
          reason = unbanLog.reason || reason;
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for unban:", error);
      }

      Logger.info(`User unbanned: ${user.tag} (${user.id}) by ${moderator}`);

      const embed = new EmbedBuilder()
        .setTitle("🔓 User Unbanned")
        .setDescription(
          `<@${user.id}> (${user.tag}) has been unbanned from the server.`
        )
        .addFields(
          { name: "User ID", value: user.id, inline: true },
          { name: "Unbanned By", value: moderator, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setColor("#4CD964")
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      const logChannel = guild.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in memberUnban event:", error);
    }
  },
  "logging"
);
