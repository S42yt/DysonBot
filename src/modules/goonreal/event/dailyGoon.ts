import { Event } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";
import { TextChannel, ButtonStyle, Client } from "discord.js";
import cron from "node-cron";
import fetch from "node-fetch";
import DailyGoonLog from "../schema/dailyGoonLog.js";

function getRandomReminderTime(): Date {
  const now = new Date();
  const nextReminderTime = new Date(now);

  nextReminderTime.setHours(8, 0, 0, 0);

  if (now > nextReminderTime) {
    nextReminderTime.setDate(nextReminderTime.getDate() + 1);
  }

  const startOfDay = new Date(nextReminderTime);
  startOfDay.setHours(8, 0, 0, 0);
  const endOfDay = new Date(nextReminderTime);
  endOfDay.setHours(23, 59, 59, 999);

  const randomTimestamp =
    startOfDay.getTime() + Math.random() * (endOfDay.getTime() - startOfDay.getTime());

  return new Date(randomTimestamp);
}

function dateToCron(date: Date): string {
  return `${date.getMinutes()} ${date.getHours()} * * *`;
}

let scheduledTask: cron.ScheduledTask | null = null;

async function getRandomMemeThumbnail(): Promise<string | undefined> {
  try {
    const res = await fetch("https://meme-api.com/gimme");
    if (!res.ok) return undefined;
    const data = await res.json();
    if (typeof data === "object" && data !== null && "url" in data && typeof (data as any).url === "string") {
      return (data as any).url;
    }
    return undefined;
  } catch (e) {
    Logger.error("Failed to fetch meme thumbnail:", e);
    return undefined;
  }
}

export async function sendDailyGoonReminder(
  client: Client, 
  guildId: string,
  triggeredBy: "automatic" | "manual" = "automatic",
  adminUserId?: string
): Promise<boolean> {
  try {
    const configHandler = ConfigHandler.getInstance();
    const moduleEnv = configHandler.getModuleEnv("goonreal");
    const goonRealTimeRole = moduleEnv?.goonRealTimeRole;
    const goonRealTimeChannel = moduleEnv?.goonRealTimeChannel;

    if (!goonRealTimeRole || !goonRealTimeChannel) {
      Logger.error("Goon real time role or channel not configured");
      return false;
    }

    const alreadySent = await DailyGoonLog.hasBeenSentToday(guildId);
    if (alreadySent && triggeredBy === "automatic") {
      Logger.info(`Daily goon reminder already sent today for guild ${guildId}, skipping automatic send`);
      return true; 
    }

    const channel = client.channels.cache.get(goonRealTimeChannel) as TextChannel;
    if (!channel) {
      Logger.error(`Goon real time channel ${goonRealTimeChannel} not found`);
      return false;
    }

    const thumbnail = await getRandomMemeThumbnail();

    const embed = new Embed({
      title: "🔥 Täglicher Goon Call",
      description: "Jetzt goonen um deine Streak aufrecht zu erhalten!",
      color: "#db3dff",
      timestamp: true,
      thumbnail,
    });

    embed.addButton({
      customId: "goon_submit",
      label: "Goon Experience teilen",
      style: ButtonStyle.Primary,
    });

    await channel.send({
      content: `<@&${goonRealTimeRole}>`,
      ...embed.toMessagePayload(),
    });

    await DailyGoonLog.logDailyGoon(guildId, triggeredBy, adminUserId);

    Logger.info(`Daily goon reminder sent successfully (${triggeredBy}) for guild ${guildId}`);
    return true;
  } catch (error) {
    Logger.error("Error sending daily goon reminder:", error);
    return false;
  }
}

export async function scheduleDailyGoonReminder(client: Client): Promise<void> {
  if (scheduledTask) {
    scheduledTask.destroy();
  }

  scheduledTask = cron.schedule("0 8 * * *", async () => {
    try {
      const guilds = client.guilds.cache;
      
      for (const [guildId, guild] of guilds) {
        const randomTime = getRandomReminderTime();
        const cronString = dateToCron(randomTime);
        
        Logger.info(`Scheduling daily goon for guild ${guild.name} at ${randomTime.toLocaleString()}`);
        
        cron.schedule(cronString, async () => {
          await sendDailyGoonReminder(client, guildId, "automatic");
        });
      }
    } catch (error) {
      Logger.error("Error in daily goon scheduler:", error);
    }
  }, {
    timezone: "Europe/Berlin"
  });

  Logger.info("Daily goon reminder scheduler initialized.");
}

export default new Event(
  "ready",
  async (client) => {
    try {
      await scheduleDailyGoonReminder(client);
    } catch (error) {
      Logger.error("Error setting up daily goon event:", error);
    }
  },
  "goonreal",
  true
);