import { CommandInteraction } from "discord.js";
import { Command, DatabaseHandler } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";

export default new Command(
  {
    name: "ping",
    description: "Replies with the bot latency and database status",
  },
  async (interaction: CommandInteraction) => {
    const startTime = Date.now();

    const ping = interaction.client.ws.ping;

    await interaction.deferReply();

    const roundtrip = Date.now() - startTime;

    let dbStatus = "❌ Not connected";
    let dbLatency = "N/A";

    try {
      const dbHandler = DatabaseHandler.getInstance();

      const dbStart = Date.now();

      if (!dbHandler.connection?.connections[0]?.readyState) {
        await dbHandler.connect();
      }

      if (dbHandler.connection?.connections[0]?.readyState === 1) {
        const db = dbHandler.connection.connections[0].db;
        if (db) {
          await db.admin().ping();
          const dbEnd = Date.now();
          dbLatency = `${dbEnd - dbStart}ms`;
          dbStatus = "✅ Connected";
        }
      }
    } catch (error) {
      Logger.error("Database ping error:", error);
      dbStatus = `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    const embed = new Embed({
      title: "🏓 Pong!",
      description: `**Websocket heartbeat:** ${ping}ms\n**Roundtrip latency:** ${roundtrip}ms\n**Database status:** ${dbStatus}\n**Database latency:** ${dbLatency}`,
      color: "#43B581",
      timestamp: true,
      footer: {
        text: "DysonBot System Status",
      },
    });

    await interaction.editReply({ embeds: [embed] });
  },
  "misc"
);
