import { CommandInteraction, GuildMember } from 'discord.js';
import { Command } from '../../../core/index.js';
import { Embed } from '../../../types/embed.js';
import { MemberStatusModel } from '../schema/memberStatus.js';
import {
  parseDuration,
  formatDuration,
} from '../../../utils/durationHandler.js';
import Logger from '../../../utils/logger.js';
import ConfigHandler from '../../../utils/configHandler.js';

export default new Command(
  {
    name: 'abmelden',
    description: 'Markiere dich als abwesend',
    options: [
      {
        name: 'zeit',
        description: 'Wie lange wirst du abwesend sein (Format: 1d2h3m4s)',
        type: 3,
        required: true,
      },
      {
        name: 'grund',
        description: 'Grund für deine Abwesenheit',
        type: 3,
        required: true,
      },
    ],
  },
  async (interaction: CommandInteraction): Promise<void> => {
    try {
      const member = interaction.member as GuildMember;
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

      const timeStr = interaction.options.get('zeit')?.value as string;
      const reason = interaction.options.get('grund')?.value as string;

      const duration = parseDuration(timeStr);
      if (!duration) {
        await interaction.reply({
          embeds: [
            new Embed({
              title: '❌ Ungültige Zeit',
              description:
                'Ungültiges Zeitformat. Bitte verwende das Format wie 1d2h3m4s (Tage, Stunden, Minuten, Sekunden).',
              color: '#ED4245',
            }),
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const endTime = new Date(Date.now() + duration);
      const formattedDuration = formatDuration(duration);

      let memberStatus = await MemberStatusModel.findOne({ userId: member.id });

      if (!memberStatus) {
        memberStatus = new MemberStatusModel({
          userId: member.id,
          displayName: member.displayName,
          username: member.user.username,
        });
      }

      memberStatus.status = 'abgemeldet';
      memberStatus.reason = reason;
      memberStatus.endTime = endTime;
      memberStatus.displayName = member.displayName;
      memberStatus.username = member.user.username;

      await memberStatus.save();

      const embed = new Embed({
        title: '✅ Erfolgreich abgemeldet',
        description: `Du wurdest erfolgreich für ${formattedDuration} abgemeldet.`,
        color: '#43B581',
        fields: [
          {
            name: '⏱️ Rückkehr erwartet',
            value: endTime.toLocaleString('de-DE'),
            inline: true,
          },
          {
            name: '📝 Grund',
            value: reason,
            inline: true,
          },
        ],
        footer: {
          text: 'Du kannst dich jederzeit mit /anmelden zurückmelden',
        },
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error('Error in abmelden command:', error);

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
