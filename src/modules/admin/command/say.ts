import {
  CommandInteraction,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../../core/index.js';
import { Embed } from '../../../types/embed.js';
import Logger from '../../../utils/logger.js';

export default new Command(
  {
    name: 'say',
    description: 'Make the bot say a message',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
      {
        name: 'message',
        description: 'The message to send',
        type: 3,
        required: true,
      },
    ],
  },
  async (interaction: CommandInteraction) => {
    const message = (
      interaction.options as CommandInteractionOptionResolver
    ).getString('message');

    if (!message) {
      await interaction.reply({
        embeds: [Embed.error('Please provide a message to send', 'Error')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = interaction.channel;

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [
          Embed.error(
            'This command can only be used in text channels',
            'Error'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!('send' in channel)) {
      await interaction.reply({
        embeds: [
          Embed.error('Cannot send messages to this channel type', 'Error'),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        Embed.success(
          'Your message will be sent to the channel',
          'Message Sending'
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

    try {
      await channel.send(message);

      const channelName = 'name' in channel ? channel.name : 'unknown';
      Logger.info(
        `Admin ${interaction.user.tag} used the say command in #${channelName} (${channel.id})`
      );
    } catch (error) {
      Logger.error('Error in say command:', error);

      await interaction.editReply({
        embeds: [
          Embed.error(
            `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
            'Error'
          ),
        ],
      });
    }
  },
  'admin'
);
