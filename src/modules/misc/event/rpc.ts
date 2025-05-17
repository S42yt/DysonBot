import { ActivityType, Client } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";

export default new Event(
  "ready",
  async (client: Client) => {
    try {
      client.user?.setPresence({
        activities: [
          {
            name: "Spendet dem Dyson Clan",
            type: ActivityType.Playing,
          },
        ],
        status: "online",
      });

      Logger.info("Bot presence (RPC) has been set successfully");
    } catch (error) {
      Logger.error("Failed to set bot presence:", error);
    }
  },
  "misc",
  true
);
