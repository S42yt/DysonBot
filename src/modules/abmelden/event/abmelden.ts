import { Event } from "../../../core/index.js";
import { MemberStatusModel } from "../schema/memberStatus.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event<"guildMemberUpdate">(
  "guildMemberUpdate",
  async (oldMember, newMember) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("abmelden");
      const clanRoleId = moduleEnv.role;

      if (
        !oldMember.roles.cache.has(clanRoleId) &&
        newMember.roles.cache.has(clanRoleId)
      ) {
        let memberStatus = await MemberStatusModel.findOne({
          userId: newMember.id,
        });

        if (!memberStatus) {
          memberStatus = new MemberStatusModel({
            userId: newMember.id,
            displayName: newMember.displayName,
            username: newMember.user.username,
            status: "angemeldet",
          });
          await memberStatus.save();
          Logger.info(
            `Member ${newMember.user.tag} added to abmelden tracking`
          );
        }
      }

      if (
        oldMember.roles.cache.has(clanRoleId) &&
        !newMember.roles.cache.has(clanRoleId)
      ) {
        Logger.info(
          `Member ${newMember.user.tag} lost clan role, may need cleanup`
        );
      }
    } catch (error) {
      Logger.error("Error in abmelden event:", error);
    }
  },
  "abmelden"
);
