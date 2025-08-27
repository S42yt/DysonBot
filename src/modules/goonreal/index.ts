import { Client } from "discord.js";
import Logger from "../../utils/logger.js";
import ConfigHandler from "../../utils/configHandler.js";

export default {
  name: "goonreal",
  description: "Goon streak tracking and daily challenges",

  init: async (client: Client): Promise<void> => {
    const configHandler = ConfigHandler.getInstance();
    const moduleConfig = configHandler.getModuleConfig("goonreal");

    Logger.info(
      `Goonreal module initialized for ${client.user?.tag || "unknown"}`
    );
    Logger.info(
      `Available commands: ${Object.keys(moduleConfig.commands || {}).join(", ") || "All"}`
    );
    Logger.info(
      `Available events: ${Object.keys(moduleConfig.events || {}).join(", ") || "All"}`
    );
  },
};
