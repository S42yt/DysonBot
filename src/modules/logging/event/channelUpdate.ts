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
  "channelUpdate",
  async (oldChannel, newChannel) => {
    try {
      if (!("guild" in newChannel) || !newChannel.guild) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.channelUpdate) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      if (newChannel.id === logChannelId) return;

      const changes = [];

      if (
        "name" in oldChannel &&
        "name" in newChannel &&
        oldChannel.name !== newChannel.name
      ) {
        changes.push(`Name: \`${oldChannel.name}\` → \`${newChannel.name}\``);
      }

      if (
        "topic" in oldChannel &&
        "topic" in newChannel &&
        oldChannel.topic !== newChannel.topic
      ) {
        const oldTopic = oldChannel.topic || "No topic";
        const newTopic = newChannel.topic || "No topic";
        changes.push(`Topic: \`${oldTopic}\` → \`${newTopic}\``);
      }

      if (
        "nsfw" in oldChannel &&
        "nsfw" in newChannel &&
        oldChannel.nsfw !== newChannel.nsfw
      ) {
        changes.push(
          `NSFW: ${oldChannel.nsfw ? "Yes" : "No"} → ${newChannel.nsfw ? "Yes" : "No"}`
        );
      }

      if (
        "rateLimitPerUser" in oldChannel &&
        "rateLimitPerUser" in newChannel &&
        oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser
      ) {
        const oldLimit = oldChannel.rateLimitPerUser
          ? `${oldChannel.rateLimitPerUser} seconds`
          : "No limit";
        const newLimit = newChannel.rateLimitPerUser
          ? `${newChannel.rateLimitPerUser} seconds`
          : "No limit";
        changes.push(`Slowmode: ${oldLimit} → ${newLimit}`);
      }

      if (
        "bitrate" in oldChannel &&
        "bitrate" in newChannel &&
        oldChannel.bitrate !== newChannel.bitrate
      ) {
        changes.push(
          `Bitrate: ${oldChannel.bitrate / 1000} kbps → ${newChannel.bitrate / 1000} kbps`
        );
      }

      if (
        "userLimit" in oldChannel &&
        "userLimit" in newChannel &&
        oldChannel.userLimit !== newChannel.userLimit
      ) {
        const oldLimit = oldChannel.userLimit || "Unlimited";
        const newLimit = newChannel.userLimit || "Unlimited";
        changes.push(`User Limit: ${oldLimit} → ${newLimit}`);
      }

      if (
        "parentId" in oldChannel &&
        "parentId" in newChannel &&
        oldChannel.parentId !== newChannel.parentId
      ) {
        const oldParent = oldChannel.parentId
          ? newChannel.guild.channels.cache.get(oldChannel.parentId)?.name ||
            "Unknown category"
          : "No category";
        const newParent = newChannel.parentId
          ? newChannel.guild.channels.cache.get(newChannel.parentId)?.name ||
            "Unknown category"
          : "No category";
        changes.push(`Category: ${oldParent} → ${newParent}`);
      }

      if (changes.length === 0) {
        return;
      }

      let updatedBy = "Unknown";

      try {
        const auditLogs = await newChannel.guild.fetchAuditLogs({
          type: AuditLogEvent.ChannelUpdate,
          limit: 1,
        });

        const channelLog = auditLogs.entries.first();
        if (
          channelLog &&
          channelLog.target?.id === newChannel.id &&
          Date.now() - channelLog.createdTimestamp < 5000
        ) {
          updatedBy = channelLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for channel update:", error);
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

      const channelType =
        typeMapping[newChannel.type] || "Unknown Channel Type";

      Logger.info(
        `Channel updated: #${newChannel.name} (${newChannel.id}) by ${updatedBy}`
      );

      const embed = new EmbedBuilder()
        .setTitle("✏️ Channel Updated")
        .setDescription(
          `${channelType} **${newChannel.name}** has been updated.`
        )
        .addFields(
          { name: "Channel ID", value: newChannel.id, inline: true },
          { name: "Updated By", value: updatedBy, inline: true },
          { name: "Type", value: channelType, inline: true },
          { name: "Changes", value: changes.join("\n"), inline: false }
        )
        .setColor("#FF9500")
        .setTimestamp();

      const logChannel = newChannel.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in channelUpdate event:", error);
    }
  },
  "logging"
);
