import { Message } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

export default new Event(
  "messageCreate",
  async (message: Message) => {
    try {
      if (message.author.bot) return;

      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("misc");
      const boostChannelId = moduleEnv.boostChannel;

      if (!boostChannelId) {
        Logger.error("Boost channel ID is not configured");
        return;
      }

      if (message.channelId === boostChannelId) {
        await message.react("❤️");
        Logger.info(
          `Added heart reaction to message in boost channel from ${message.author.tag}`
        );
      }
    } catch (error) {
      Logger.error("Error in boost event:", error);
    }
  },
  "misc"
);
