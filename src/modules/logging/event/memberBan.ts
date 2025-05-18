import { GuildBan, EmbedBuilder, TextChannel, AuditLogEvent } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "guildBanAdd",
  async (ban: GuildBan) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.memberBan) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      let moderator = "Unknown";
      let reason = ban.reason || "No reason provided";

      try {
        const auditLogs = await ban.guild.fetchAuditLogs({
          type: AuditLogEvent.MemberBanAdd,
          limit: 1,
        });

        const banLog = auditLogs.entries.first();
        if (
          banLog &&
          banLog.target?.id === ban.user.id &&
          Date.now() - banLog.createdTimestamp < 5000
        ) {
          moderator = banLog.executor?.tag || "Unknown";
          reason = banLog.reason || reason;
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for ban:", error);
      }

      Logger.info(
        `User banned: ${ban.user.tag} (${ban.user.id}) by ${moderator} for "${reason}"`
      );

      const embed = new EmbedBuilder()
        .setTitle("🔨 User Banned")
        .setDescription(
          `<@${ban.user.id}> (${ban.user.tag}) has been banned from the server.`
        )
        .addFields(
          { name: "User ID", value: ban.user.id, inline: true },
          { name: "Banned By", value: moderator, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setColor("#FF3B30")
        .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      const logChannel = ban.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in memberBan event:", error);
    }
  },
  "logging"
);
