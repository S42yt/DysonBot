import { Client, ChannelType } from "discord.js";
import { Event } from "../../../core/index.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";
import CounterModel from "../schema/memberCounter.js";

export default new Event(
  "ready",
  async (client: Client) => {
    try {
      Logger.info("Starting member counter service");

      await updateMemberCount(client);

      setInterval(() => updateMemberCount(client), 5 * 60 * 1000);
    } catch (error) {
      Logger.error("Error in member counter event:", error);
    }
  },
  "admin",
  true
);

async function updateMemberCount(client: Client): Promise<void> {
  try {
    const counters = await CounterModel.find();
    let counterFound = false;

    if (counters.length > 0) {
      counterFound = true;

      for (const counter of counters) {
        const guild = client.guilds.cache.get(counter.guildId);
        if (!guild) {
          Logger.warn(`Guild ${counter.guildId} not found for member counter`);
          continue;
        }

        const channel = guild.channels.cache.get(counter.channelId);
        if (!channel) {
          Logger.warn(
            `Counter channel ${counter.channelId} not found for guild ${guild.name}, might have been deleted`
          );

          await CounterModel.deleteOne({ _id: counter._id });
          Logger.info(
            `Removed deleted counter channel from database for guild ${guild.name}`
          );
          continue;
        }

        if (channel.type !== ChannelType.GuildVoice) {
          Logger.warn(
            `Counter channel ${counter.channelId} is not a voice channel`
          );
          continue;
        }

        const memberCount = guild.memberCount;
        const channelName = counter.format.replace(
          "{count}",
          memberCount.toString()
        );

        if (channel.name !== channelName) {
          await channel.setName(channelName);
          Logger.info(
            `Updated member counter to "${channelName}" in guild ${guild.name} (Members: ${memberCount})`
          );

          counter.lastUpdated = new Date();
          await counter.save();
        }
      }
    }

    if (!counterFound) {
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("admin");
      const channelId = moduleEnv.counterChannelId;
      const format = moduleEnv.counterFormat || "「👥」Mitglieder✩ {count}";

      if (channelId) {
        for (const guild of client.guilds.cache.values()) {
          const channel = guild.channels.cache.get(channelId);

          if (channel && channel.type === ChannelType.GuildVoice) {
            const memberCount = guild.memberCount;
            const channelName = format.replace(
              "{count}",
              memberCount.toString()
            );

            if (channel.name !== channelName) {
              await channel.setName(channelName);
              Logger.info(
                `Updated member counter to "${channelName}" in guild ${guild.name} (Members: ${memberCount})`
              );
            }

            await CounterModel.createOrUpdateCounter(
              guild.id,
              channel.id,
              format
            );

            Logger.info(
              `Migrated member counter from environment variables to database for guild ${guild.name}`
            );

            break;
          }
        }
      }
    }
  } catch (error) {
    Logger.error("Error updating member count:", error);
  }
}
