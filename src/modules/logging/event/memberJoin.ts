import { GuildMember, EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "guildMemberAdd",
  async (member: GuildMember) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.memberJoin) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      const createdAt = member.user.createdAt;
      const now = new Date();
      const accountAge = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      Logger.info(`Member joined: ${member.user.tag} (${member.id})`);

      const embed = new EmbedBuilder()
        .setTitle("👋 Member Joined")
        .setDescription(
          `<@${member.id}> (${member.user.tag}) has joined the server.`
        )
        .addFields(
          {
            name: "Account Created",
            value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`,
            inline: true,
          },
          { name: "Account Age", value: `${accountAge} days`, inline: true },
          {
            name: "Member Count",
            value: `${member.guild.memberCount}`,
            inline: true,
          }
        )
        .setColor("#4CD964")
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      const logChannel = member.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in memberJoin event:", error);
    }
  },
  "logging"
);
