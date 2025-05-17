import { CommandInteraction, version as discordJsVersion, SlashCommandBuilder } from "discord.js";
import { DatabaseHandler } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import os from "os";
import process from "process";
import Logger from "../../../utils/logger.js";

class StatusCommand {
  public readonly name = "status";
  public readonly module = "misc";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Shows bot status and system information");

  public async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    const client = interaction.client;
    const uptime = formatUptime(client.uptime || 0);

    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    const platform = os.platform();
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const cpuCores = os.cpus().length;

    let dbStatus = "❌ Not connected";
    let dbLatency = "N/A";
    let dbVersion = "N/A";

    try {
      const dbHandler = DatabaseHandler.getInstance();

      const dbStart = Date.now();

      if (!dbHandler.connection.connections[0]?.readyState) {
        await dbHandler.connect();
      }

      if (dbHandler.connection.connections[0]?.readyState === 1) {
        const db = dbHandler.connection.connections[0].db;
        if (db) {
          await db.admin().ping();
          const dbEnd = Date.now();
          dbLatency = `${dbEnd - dbStart}ms`;
          dbStatus = "✅ Connected";

          const buildInfo = await db.admin().buildInfo();
          dbVersion = buildInfo.version || "Unknown";
        }
      }
    } catch (error) {
      Logger.error("Database status error:", error);
      dbStatus = `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    const embed = new Embed({
      title: "🤖 Bot Status",
      color: "#43B581",
      thumbnail: client.user?.displayAvatarURL({ size: 256 }),
      footer: {
        text: `Discord.js v${discordJsVersion} | Node ${process.version}`,
      },
      timestamp: true,
      fields: [
        {
          name: "⏱️ Uptime",
          value: uptime,
          inline: true,
        },
        {
          name: "📊 Memory",
          value: `${memoryUsedMB} MB / ${memoryTotalMB} MB`,
          inline: true,
        },
        {
          name: "🖥️ System",
          value: `${platform} | CPU Load: ${cpuLoad} | Cores: ${cpuCores}`,
          inline: false,
        },
        {
          name: "🌐 Servers",
          value: client.guilds.cache.size.toString(),
          inline: true,
        },
        {
          name: "👥 Users",
          value: client.users.cache.size.toString(),
          inline: true,
        },
        {
          name: "🔌 Ping",
          value: `${client.ws.ping}ms`,
          inline: true,
        },
        {
          name: "💾 Database",
          value: `Status: ${dbStatus}\nLatency: ${dbLatency}\nVersion: ${dbVersion}`,
          inline: false,
        },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

export default new StatusCommand();
