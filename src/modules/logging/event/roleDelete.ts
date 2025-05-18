import { AuditLogEvent, EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "roleDelete",
  async role => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.roleDelete) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      let deletedBy = "Unknown";

      try {
        const auditLogs = await role.guild.fetchAuditLogs({
          type: AuditLogEvent.RoleDelete,
          limit: 1,
        });

        const roleLog = auditLogs.entries.first();
        if (
          roleLog &&
          roleLog.target?.id === role.id &&
          Date.now() - roleLog.createdTimestamp < 5000
        ) {
          deletedBy = roleLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for role delete:", error);
      }

      const roleColor = role.color
        ? `#${role.color.toString(16).padStart(6, "0")}`
        : "#99AAB5";

      Logger.info(`Role deleted: ${role.name} (${role.id}) by ${deletedBy}`);

      const embed = new EmbedBuilder()
        .setTitle("🗑️ Role Deleted")
        .setDescription(`Role **${role.name}** has been deleted.`)
        .addFields(
          { name: "Role ID", value: role.id, inline: true },
          { name: "Deleted By", value: deletedBy, inline: true },
          { name: "Color", value: roleColor, inline: true }
        )
        .setColor("#FF3B30")
        .setTimestamp();

      const logChannel = role.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in roleDelete event:", error);
    }
  },
  "logging"
);
