import { Role, EmbedBuilder, TextChannel, AuditLogEvent } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "roleCreate",
  async (role: Role) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.roleCreate) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      let creator = "Unknown";
      try {
        const auditLogs = await role.guild.fetchAuditLogs({
          type: AuditLogEvent.RoleCreate,
          limit: 1,
        });

        const roleLog = auditLogs.entries.first();
        if (
          roleLog &&
          roleLog.target?.id === role.id &&
          Date.now() - roleLog.createdTimestamp < 5000
        ) {
          creator = roleLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for role create:", error);
      }

      Logger.info(`Role created: ${role.name} (${role.id}) by ${creator}`);

      const roleColorString = role.color
        ? `#${role.color.toString(16).padStart(6, "0")}`
        : "#99AAB5";
      const roleColor =
        role.color || parseInt(roleColorString.replace("#", ""), 16);

      const embed = new EmbedBuilder()
        .setTitle("🎭 Role Created")
        .setDescription(`Role **${role.name}** has been created.`)
        .addFields(
          { name: "Role ID", value: role.id, inline: true },
          { name: "Created By", value: creator, inline: true },
          {
            name: "Mentionable",
            value: role.mentionable ? "Yes" : "No",
            inline: true,
          },
          { name: "Position", value: role.position.toString(), inline: true },
          { name: "Color", value: roleColorString, inline: true }
        )
        .setColor(roleColor)
        .setTimestamp();

      const logChannel = role.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in roleCreate event:", error);
    }
  },
  "logging"
);
