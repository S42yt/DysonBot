import {
  Message,
  PartialMessage,
  EmbedBuilder,
  TextChannel,
  AuditLogEvent,
} from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "messageDelete",
  async (message: Message | PartialMessage) => {
    try {
      if (message.author?.bot) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.messageDelete) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      if (message.channelId === logChannelId) return;

      if (message.partial) {
        Logger.warn("Message content unavailable (likely not cached)");
        return;
      }

      let content = message.content || "No content";

      if (message.attachments.size > 0) {
        const attachmentLinks = Array.from(message.attachments.values()).map(
          attachment => attachment.url
        );
        content += "\n**Attachments:**\n" + attachmentLinks.join("\n");
      }

      // Try to get who deleted the message
      let executor = "Unknown";
      try {
        const auditLogs = await message.guild?.fetchAuditLogs({
          type: AuditLogEvent.MessageDelete,
          limit: 1,
        });

        const deletionLog = auditLogs?.entries.first();
        if (
          deletionLog &&
          deletionLog.extra.channel.id === message.channelId &&
          Date.now() - deletionLog.createdTimestamp < 5000
        ) {
          executor = deletionLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs:", error);
      }

      Logger.info(
        `Message deleted in #${message.channel} (${message.channelId}) by ${message.author.tag}: ${content}`
      );

      const embed = new EmbedBuilder()
        .setTitle("🗑️ Message Deleted")
        .setDescription(
          content.length > 4000 ? content.substring(0, 4000) + "..." : content
        )
        .addFields(
          { name: "Channel", value: `<#${message.channelId}>`, inline: true },
          {
            name: "Author",
            value: `<@${message.author.id}> (${message.author.tag})`,
            inline: true,
          },
          { name: "Deleted by", value: executor, inline: true }
        )
        .setColor("#FF3B30") // Red color for deletion
        .setThumbnail(message.author.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      const logChannel = message.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in messageDelete event:", error);
    }
  },
  "logging"
);
