import { GuildMember } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "guildMemberAdd",
  async (member: GuildMember) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("welcome");
      const joinRoleId = moduleEnv.joinRole;

      if (!joinRoleId) {
        Logger.error("Join role ID is not configured");
        return;
      }

      const role = member.guild.roles.cache.get(joinRoleId);
      if (!role) {
        Logger.error(`Join role ${joinRoleId} not found`);
        return;
      }

      await member.roles.add(role);
      Logger.info(`Added join role to ${member.user.tag}`);
    } catch (error) {
      Logger.error("Error in joinrole event:", error);
    }
  },
  "welcome"
);
