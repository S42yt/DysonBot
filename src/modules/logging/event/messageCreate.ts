import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "messageCreate",
  async (message: Message) => {
    try {
      if (message.author?.bot) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.messageCreate) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      if (message.channelId === logChannelId) return;

      let content = message.content || "No content";

      if (message.attachments.size > 0) {
        const attachmentLinks = Array.from(message.attachments.values()).map(
          attachment => attachment.url
        );
        content += "\n**Attachments:**\n" + attachmentLinks.join("\n");
      }

      if (message.stickers.size > 0) {
        content += "\n**Stickers:**\n";
        message.stickers.forEach(sticker => {
          content += `${sticker.name} `;
        });
      }

      Logger.info(
        `Message sent in #${message.channel} (${message.channelId}) by ${message.author.tag}`
      );

      const embed = new EmbedBuilder()
        .setTitle("✉️ Message Sent")
        .setDescription(
          content.length > 4000 ? content.substring(0, 4000) + "..." : content
        )
        .addFields(
          { name: "Channel", value: `<#${message.channelId}>`, inline: true },
          {
            name: "Author",
            value: `<@${message.author.id}> (${message.author.tag})`,
            inline: true,
          }
        )
        .setColor("#4CD964")
        .setThumbnail(message.author.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      const logChannel = message.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in messageCreate event:", error);
    }
  },
  "logging"
);
