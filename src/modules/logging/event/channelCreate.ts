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
  "channelCreate",
  async channel => {
    try {
      if (!channel.guild) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.channelCreate) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      if (channel.id === logChannelId) return;

      let createdBy = "Unknown";

      try {
        const auditLogs = await channel.guild.fetchAuditLogs({
          type: AuditLogEvent.ChannelCreate,
          limit: 1,
        });

        const channelLog = auditLogs.entries.first();
        if (
          channelLog &&
          channelLog.target?.id === channel.id &&
          Date.now() - channelLog.createdTimestamp < 5000
        ) {
          createdBy = channelLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for channel create:", error);
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
        `Channel created: #${channel.name} (${channel.id}) by ${createdBy}`
      );

      const embed = new EmbedBuilder()
        .setTitle("📝 Channel Created")
        .setDescription(`${channelType} **${channel.name}** has been created.`)
        .addFields(
          { name: "Channel ID", value: channel.id, inline: true },
          { name: "Created By", value: createdBy, inline: true },
          { name: "Type", value: channelType, inline: true }
        )
        .setColor("#4CD964")
        .setTimestamp();

      if (channel.type === ChannelType.GuildCategory) {
        embed.addFields({
          name: "Category",
          value: "This is a category",
          inline: true,
        });
      } else if ("parent" in channel && channel.parent) {
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
      Logger.error("Error in channelCreate event:", error);
    }
  },
  "logging"
);
