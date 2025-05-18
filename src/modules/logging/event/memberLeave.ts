import {
  GuildMember,
  PartialGuildMember,
  EmbedBuilder,
  TextChannel,
  AuditLogEvent,
} from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "guildMemberRemove",
  async (member: GuildMember | PartialGuildMember) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.memberLeave) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      let kickInfo = null;
      try {
        const auditLogs = await member.guild?.fetchAuditLogs({
          type: AuditLogEvent.MemberKick,
          limit: 1,
        });

        const kickLog = auditLogs?.entries.first();
        if (
          kickLog &&
          kickLog.target &&
          kickLog.target.id === member.id &&
          Date.now() - kickLog.createdTimestamp < 5000
        ) {
          kickInfo = {
            moderator: kickLog.executor?.tag || "Unknown",
            reason: kickLog.reason || "No reason provided",
          };
        }
      } catch (error) {}

      const user = member instanceof GuildMember ? member.user : member;
      const joinedAt = member instanceof GuildMember ? member.joinedAt : null;

      Logger.info(
        kickInfo
          ? `Member kicked: ${user.displayName} (${user.id}) by ${kickInfo.moderator} for "${kickInfo.reason}"`
          : `Member left: ${user.displayName} (${user.id})`
      );

      const embed = new EmbedBuilder()
        .setTitle(kickInfo ? "👢 Member Kicked" : "👋 Member Left")
        .setDescription(
          `<@${user.id}> (${user.displayName}) has ${kickInfo ? "been kicked from" : "left"} the server.`
        )
        .setColor(kickInfo ? "#FF9500" : "#8E8E93")
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      if (joinedAt) {
        const now = new Date();
        const memberDuration = Math.floor(
          (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        embed.addFields(
          {
            name: "Joined At",
            value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:R>`,
            inline: true,
          },
          {
            name: "Member Duration",
            value: `${memberDuration} days`,
            inline: true,
          }
        );
      }

      if (kickInfo) {
        embed.addFields(
          { name: "Kicked By", value: kickInfo.moderator, inline: true },
          { name: "Reason", value: kickInfo.reason, inline: true }
        );
      }

      const logChannel = member.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in memberLeave event:", error);
    }
  },
  "logging"
);
