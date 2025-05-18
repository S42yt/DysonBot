import {
  AuditLogEvent,
  ChannelType,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "channelDelete",
  async channel => {
    try {
      if (!("guild" in channel) || !channel.guild) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.channelDelete) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      let deletedBy = "Unknown";

      try {
        const auditLogs = await channel.guild.fetchAuditLogs({
          type: AuditLogEvent.ChannelDelete,
          limit: 1,
        });

        const channelLog = auditLogs.entries.first();
        if (
          channelLog &&
          channelLog.target?.id === channel.id &&
          Date.now() - channelLog.createdTimestamp < 5000
        ) {
          deletedBy = channelLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for channel delete:", error);
      }

      const typeMapping: Record<number, string> = {
        [ChannelType.GuildText]: "Text Channel",
        [ChannelType.GuildVoice]: "Voice Channel",
        [ChannelType.GuildCategory]: "Category",
        [ChannelType.GuildAnnouncement]: "Announcement Channel",
        [ChannelType.GuildStageVoice]: "Stage Channel",
        [ChannelType.GuildForum]: "Forum Channel",
        [ChannelType.AnnouncementThread]: "Announcement Thread",
        [ChannelType.PublicThread]: "Public Thread",
        [ChannelType.PrivateThread]: "Private Thread",
      };

      const channelType = typeMapping[channel.type] || "Unknown Channel Type";

      Logger.info(
        `Channel deleted: #${channel.name} (${channel.id}) by ${deletedBy}`
      );

      const embed = new EmbedBuilder()
        .setTitle("🗑️ Channel Deleted")
        .setDescription(`${channelType} **${channel.name}** has been deleted.`)
        .addFields(
          { name: "Channel ID", value: channel.id, inline: true },
          { name: "Deleted By", value: deletedBy, inline: true },
          { name: "Type", value: channelType, inline: true }
        )
        .setColor("#FF3B30")
        .setTimestamp();

      if ("parent" in channel && channel.parent) {
        embed.addFields({
          name: "Category",
          value: channel.parent.name,
          inline: true,
        });
      }

      const logChannel = channel.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in channelDelete event:", error);
    }
  },
  "logging"
);
