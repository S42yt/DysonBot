import { CommandInteraction, version as discordJsVersion } from 'discord.js';
import { Command } from '../../../core';
import { Embed } from '../../../types/embed';
import os from 'os';
import process from 'process';

export default new Command(
  {
    name: 'status',
    description: 'Shows bot status and system information',
  },
  async (interaction: CommandInteraction) => {
    const client = interaction.client;
    const uptime = formatUptime(client.uptime || 0);

    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    const platform = os.platform();
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const cpuCores = os.cpus().length;

    const embed = new Embed({
      title: '🤖 Bot Status',
      color: '#43B581',
      thumbnail: client.user?.displayAvatarURL({ size: 256 }),
      footer: {
        text: `Discord.js v${discordJsVersion} | Node ${process.version}`,
      },
      timestamp: true,
      fields: [
        {
          name: '⏱️ Uptime',
          value: uptime,
          inline: true,
        },
        {
          name: '📊 Memory',
          value: `${memoryUsedMB} MB / ${memoryTotalMB} MB`,
          inline: true,
        },
        {
          name: '🖥️ System',
          value: `${platform} | CPU Load: ${cpuLoad} | Cores: ${cpuCores}`,
          inline: false,
        },
        {
          name: '🌐 Servers',
          value: client.guilds.cache.size.toString(),
          inline: true,
        },
        {
          name: '👥 Users',
          value: client.users.cache.size.toString(),
          inline: true,
        },
        {
          name: '🔌 Ping',
          value: `${client.ws.ping}ms`,
          inline: true,
        },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  'misc'
);

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}
