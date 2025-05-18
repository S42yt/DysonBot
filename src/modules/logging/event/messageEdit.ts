import { Message, EmbedBuilder, TextChannel, PartialMessage } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "messageUpdate",
  async (
    oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
  ) => {
    try {
      if (oldMessage.author?.bot) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.messageEdit) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      if (oldMessage.channelId === logChannelId) return;

      if (oldMessage.partial) {
        try {
          await oldMessage.fetch();
        } catch (error) {
          Logger.warn("Failed to fetch old message content");
          return;
        }
      }

      if (newMessage.partial) {
        try {
          await newMessage.fetch();
        } catch (error) {
          Logger.warn("Failed to fetch new message content");
          return;
        }
      }

      if (oldMessage.content === newMessage.content) return;

      const oldContent = oldMessage.content || "No content";
      const newContent = newMessage.content || "No content";

      Logger.info(
        `Message edited in #${(oldMessage.channel as TextChannel).name} by ${oldMessage.author?.tag}: ${oldContent} -> ${newContent}`
      );

      const embed = new EmbedBuilder()
        .setTitle("✏️ Message Edited")
        .addFields(
          {
            name: "Before",
            value:
              oldContent.length > 1024
                ? oldContent.substring(0, 1021) + "..."
                : oldContent || "No content",
          },
          {
            name: "After",
            value:
              newContent.length > 1024
                ? newContent.substring(0, 1021) + "..."
                : newContent || "No content",
          },
          {
            name: "Channel",
            value: `<#${oldMessage.channelId}>`,
            inline: true,
          },
          {
            name: "Author",
            value: `<@${oldMessage.author?.id}> (${oldMessage.author?.tag})`,
            inline: true,
          },
          {
            name: "Jump to Message",
            value: `[Click Here](${newMessage.url})`,
            inline: true,
          }
        )
        .setColor("#FF9500")
        .setThumbnail(
          oldMessage.author?.displayAvatarURL({ size: 128 }) || null
        )
        .setTimestamp();

      const logChannel = oldMessage.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in messageEdit event:", error);
    }
  },
  "logging"
);
