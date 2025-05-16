import { ClientEvents } from 'discord.js';
import { Event } from '../../../core';
import { MemberStatusModel } from '../schema/memberStatus';
import Logger from '../../../utils/logger';
import ConfigHandler from '../../../utils/configHandler';

export default new Event<'guildMemberUpdate'>(
  'guildMemberUpdate',
  async (oldMember, newMember) => {
    // This event will trigger when a member's roles change
    // We can use it to track when members get or lose the clan role

    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv('abmelden');
      const clanRoleId = moduleEnv.role;

      // Check if member gained the clan role
      if (
        !oldMember.roles.cache.has(clanRoleId) &&
        newMember.roles.cache.has(clanRoleId)
      ) {
        // Member gained the clan role, add to database
        let memberStatus = await MemberStatusModel.findOne({
          userId: newMember.id,
        });

        if (!memberStatus) {
          memberStatus = new MemberStatusModel({
            userId: newMember.id,
            displayName: newMember.displayName,
            username: newMember.user.username,
            status: 'angemeldet',
          });
          await memberStatus.save();
          Logger.info(
            `Member ${newMember.user.tag} added to abmelden tracking`
          );
        }
      }

      // Check if member lost the clan role
      if (
        oldMember.roles.cache.has(clanRoleId) &&
        !newMember.roles.cache.has(clanRoleId)
      ) {
        // Optional: Remove from tracking or just update status
        Logger.info(
          `Member ${newMember.user.tag} lost clan role, may need cleanup`
        );
      }
    } catch (error) {
      Logger.error('Error in abmelden event:', error);
    }
  },
  'abmelden'
);
