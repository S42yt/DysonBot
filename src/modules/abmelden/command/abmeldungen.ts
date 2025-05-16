import { CommandInteraction, GuildMember, Guild, Role } from 'discord.js';
import { Command } from '../../../core';
import { Embed } from '../../../types/embed';
import { MemberStatusModel } from '../schema/memberStatus';
import Logger from '../../../utils/logger';
import ConfigHandler from '../../../utils/configHandler';
import { formatDuration } from '../../../utils/durationHandler';

export default new Command(
  {
    name: 'abmeldungen',
    description: 'Zeige alle Mitglieder mit ihrem aktuellen Status an',
  },
  async (interaction: CommandInteraction): Promise<void> => {
    try {
      const member = interaction.member as GuildMember;
      const guild = interaction.guild as Guild;
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv('abmelden');
      const clanRoleId = moduleEnv.role;

      if (!member.roles.cache.has(clanRoleId)) {
        await interaction.reply({
          embeds: [
            new Embed({
              title: '❌ Fehlende Berechtigung',
              description:
                'Du hast nicht die erforderliche Rolle, um diesen Befehl zu verwenden.',
              color: '#ED4245',
            }),
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const clanRole = (await guild.roles.fetch(clanRoleId)) as Role;
      const clanMembers = clanRole.members;

      const memberStatuses = await MemberStatusModel.find({
        userId: { $in: Array.from(clanMembers.keys()) },
      });

      const statusMap = new Map(
        memberStatuses.map(status => [status.userId, status])
      );

      const angemeldetFields = [];
      const abgemeldetFields = [];

      const now = new Date();

      for (const [userId, guildMember] of clanMembers) {
        const status = statusMap.get(userId) || {
          status: 'angemeldet',
          displayName: guildMember.displayName,
          username: guildMember.user.username,
        };

        if (!statusMap.has(userId)) {
          const newStatus = new MemberStatusModel({
            userId,
            displayName: guildMember.displayName,
            username: guildMember.user.username,
            status: 'angemeldet',
          });
          await newStatus.save();
        }

        if (status.status === 'abgemeldet' && status.endTime) {
          const remainingTime = status.endTime.getTime() - now.getTime();
          const timeLeft =
            remainingTime > 0 ? formatDuration(remainingTime) : 'Überfällig';

          abgemeldetFields.push({
            name: `${guildMember.displayName} (${guildMember.user.username})`,
            value: `Grund: ${status.reason}\nZurück in: ${timeLeft}`,
            inline: false,
          });
        } else {
          angemeldetFields.push({
            name: `${guildMember.displayName} (${guildMember.user.username})`,
            value: `Anwesend`,
            inline: true,
          });
        }
      }

      angemeldetFields.sort((a, b) => a.name.localeCompare(b.name));
      abgemeldetFields.sort((a, b) => a.name.localeCompare(b.name));

      const embeds = [];

      embeds.push(
        new Embed({
          title: '👥 Clan Mitglieder Status',
          description: `Insgesamt: ${clanMembers.size} Mitglieder | 🟢 ${angemeldetFields.length} Anwesend | 🔴 ${abgemeldetFields.length} Abwesend`,
          color: '#43B581',
          timestamp: true,
        })
      );

      if (abgemeldetFields.length > 0) {
        for (let i = 0; i < abgemeldetFields.length; i += 25) {
          embeds.push(
            new Embed({
              title:
                i === 0
                  ? '🔴 Abwesende Mitglieder'
                  : '🔴 Abwesende Mitglieder (Fortsetzung)',
              fields: abgemeldetFields.slice(i, i + 25),
              color: '#ED4245',
            })
          );
        }
      }

      if (angemeldetFields.length > 0) {
        for (let i = 0; i < angemeldetFields.length; i += 25) {
          embeds.push(
            new Embed({
              title:
                i === 0
                  ? '🟢 Anwesende Mitglieder'
                  : '🟢 Anwesende Mitglieder (Fortsetzung)',
              fields: angemeldetFields.slice(i, i + 25),
              color: '#43B581',
            })
          );
        }
      }

      await interaction.editReply({ embeds: embeds.slice(0, 10) });
    } catch (error) {
      Logger.error('Error in abmeldungen command:', error);

      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [
            new Embed({
              title: '❌ Datenbankfehler',
              description:
                'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
              color: '#ED4245',
            }),
          ],
        });
      } else {
        await interaction.reply({
          embeds: [
            new Embed({
              title: '❌ Datenbankfehler',
              description:
                'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
              color: '#ED4245',
            }),
          ],
          ephemeral: true,
        });
      }
    }
  },
  'abmelden'
);
