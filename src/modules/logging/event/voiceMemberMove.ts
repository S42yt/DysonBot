import { EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "voiceStateUpdate",
  async (oldState, newState) => {
    try {
      if (newState.member?.user.bot) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.voiceMemberMove) return;

      if (
        oldState.channelId === null ||
        newState.channelId === null ||
        oldState.channelId === newState.channelId
      )
        return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      const member = newState.member;
      if (!member) return;

      Logger.info(
        `${member.user.tag} moved from voice channel #${oldState.channel?.name} to #${newState.channel?.name}`
      );

      const embed = new EmbedBuilder()
        .setTitle("🎙️ Voice Channel Move")
        .setDescription(`<@${member.id}> switched voice channels`)
        .addFields(
          { name: "Member", value: `${member.user.tag}`, inline: true },
          {
            name: "From Channel",
            value: `${oldState.channel?.name}`,
            inline: true,
          },
          {
            name: "To Channel",
            value: `${newState.channel?.name}`,
            inline: true,
          }
        )
        .setColor("#FF9500")
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      const logChannel = newState.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in voiceMemberMove event:", error);
    }
  },
  "logging"
);
