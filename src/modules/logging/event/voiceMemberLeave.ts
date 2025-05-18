import { EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "voiceStateUpdate",
  async (oldState, newState) => {
    try {
      if (oldState.member?.user.bot) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.voiceMemberLeave) return;

      if (oldState.channelId === null || newState.channelId !== null) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      const member = oldState.member;
      if (!member) return;

      Logger.info(
        `${member.user.tag} left voice channel #${oldState.channel?.name} (${oldState.channelId})`
      );

      const embed = new EmbedBuilder()
        .setTitle("🎙️ Voice Channel Leave")
        .setDescription(
          `<@${member.id}> left voice channel <#${oldState.channelId}>`
        )
        .addFields(
          { name: "Member", value: `${member.user.tag}`, inline: true },
          { name: "Channel", value: `${oldState.channel?.name}`, inline: true }
        )
        .setColor("#FF3B30")
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      const logChannel = newState.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in voiceMemberLeave event:", error);
    }
  },
  "logging"
);
