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

      if (!moduleConfig.events.voiceMemberJoin) return;

      if (oldState.channelId !== null || newState.channelId === null) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      const member = newState.member;
      if (!member) return;

      Logger.info(
        `${member.user.tag} joined voice channel #${newState.channel?.name} (${newState.channelId})`
      );

      const embed = new EmbedBuilder()
        .setTitle("🎙️ Voice Channel Join")
        .setDescription(
          `<@${member.id}> joined voice channel <#${newState.channelId}>`
        )
        .addFields(
          { name: "Member", value: `${member.user.tag}`, inline: true },
          { name: "Channel", value: `${newState.channel?.name}`, inline: true }
        )
        .setColor("#4CD964")
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      const logChannel = newState.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in voiceMemberJoin event:", error);
    }
  },
  "logging"
);
