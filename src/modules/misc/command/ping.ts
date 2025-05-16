import { CommandInteraction } from 'discord.js';
import { Command } from '../../../core';
import { Embed } from '../../../types/embed';

export default new Command(
  {
    name: 'ping',
    description: 'Replies with the bot latency',
  },
  async (interaction: CommandInteraction) => {
    const ping = interaction.client.ws.ping;

    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new Embed({
      title: '🏓 Pong!',
      description: `**Websocket heartbeat:** ${ping}ms\n**Roundtrip latency:** ${roundtrip}ms`,
      color: '#43B581',
      timestamp: true,
    });

    await interaction.editReply({ content: null, embeds: [embed] });
  },
  'misc'
);
