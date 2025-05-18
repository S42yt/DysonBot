import { AuditLogEvent, EmbedBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "roleUpdate",
  async (oldRole, newRole) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleConfig = configHandler.getModuleConfig("logging");

      if (!moduleConfig.events.roleUpdate) return;

      const moduleEnv = configHandler.getModuleEnv("logging");
      const logChannelId = moduleEnv.logChannel;

      const changes = [];

      if (oldRole.name !== newRole.name) {
        changes.push(`Name: \`${oldRole.name}\` → \`${newRole.name}\``);
      }

      if (oldRole.color !== newRole.color) {
        const oldColor = oldRole.color
          ? `#${oldRole.color.toString(16).padStart(6, "0")}`
          : "Default";
        const newColor = newRole.color
          ? `#${newRole.color.toString(16).padStart(6, "0")}`
          : "Default";
        changes.push(`Color: ${oldColor} → ${newColor}`);
      }

      if (oldRole.hoist !== newRole.hoist) {
        changes.push(
          `Displayed separately: ${oldRole.hoist ? "Yes" : "No"} → ${newRole.hoist ? "Yes" : "No"}`
        );
      }

      if (oldRole.mentionable !== newRole.mentionable) {
        changes.push(
          `Mentionable: ${oldRole.mentionable ? "Yes" : "No"} → ${newRole.mentionable ? "Yes" : "No"}`
        );
      }

      if (oldRole.position !== newRole.position) {
        changes.push(`Position: ${oldRole.position} → ${newRole.position}`);
      }

      if (changes.length === 0) {
        return;
      }

      let updatedBy = "Unknown";

      try {
        const auditLogs = await newRole.guild.fetchAuditLogs({
          type: AuditLogEvent.RoleUpdate,
          limit: 1,
        });

        const roleLog = auditLogs.entries.first();
        if (
          roleLog &&
          roleLog.target?.id === newRole.id &&
          Date.now() - roleLog.createdTimestamp < 5000
        ) {
          updatedBy = roleLog.executor?.tag || "Unknown";
        }
      } catch (error) {
        Logger.error("Error fetching audit logs for role update:", error);
      }

      Logger.info(
        `Role updated: ${newRole.name} (${newRole.id}) by ${updatedBy}`
      );

      const embed = new EmbedBuilder()
        .setTitle("✏️ Role Updated")
        .setDescription(`Role **${newRole.name}** has been updated.`)
        .addFields(
          { name: "Role ID", value: newRole.id, inline: true },
          { name: "Updated By", value: updatedBy, inline: true },
          { name: "Changes", value: changes.join("\n"), inline: false }
        )
        .setColor("#FF9500")
        .setTimestamp();

      const logChannel = newRole.client.channels.cache.get(
        logChannelId
      ) as TextChannel;
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error("Error in roleUpdate event:", error);
    }
  },
  "logging"
);
