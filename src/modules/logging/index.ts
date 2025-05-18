import { Client } from "discord.js";
import Logger from "../../utils/logger.js";
import ConfigHandler from "../../utils/configHandler.js";

export default {
  name: "logging",
  description: "Logging system for server activities",

  init: async (client: Client): Promise<void> => {
    const configHandler = ConfigHandler.getInstance();
    const moduleEnv = configHandler.getModuleEnv("logging");
    const logChannelId = moduleEnv.logChannel;

    if (!logChannelId) {
      Logger.error("Log channel ID is not configured");
      return;
    }

    Logger.info(
      `Logging module initialized for ${client.user?.tag || "unknown"}`
    );

    const moduleConfig = configHandler.getModuleConfig("logging");
    const enabledEvents = Object.entries(moduleConfig.events || {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);

    Logger.info(`Enabled logging events: ${enabledEvents.join(", ")}`);
  },
};
