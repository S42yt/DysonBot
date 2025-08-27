import { Event } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";
import { TextChannel, ButtonStyle, Client } from "discord.js";
import cron from "node-cron";
import fetch from "node-fetch";

function getRandomTimeFromNow(): Date {
  const now = new Date();
  const min = new Date(now);
  const max = new Date(now);
  max.setHours(23, 59, 59, 999);

  if (now >= max) {
    const tomorrowMin = new Date(now);
    tomorrowMin.setDate(now.getDate() + 1);
    tomorrowMin.setHours(8, 0, 0, 0);
    const tomorrowMax = new Date(now);
    tomorrowMax.setDate(now.getDate() + 1);
    tomorrowMax.setHours(23, 59, 59, 999);

    const randomTimestamp =
      tomorrowMin.getTime() +
      Math.random() * (tomorrowMax.getTime() - tomorrowMin.getTime());
    return new Date(randomTimestamp);
  }

  const randomTimestamp =
    min.getTime() + Math.random() * (max.getTime() - min.getTime());
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
    if (typeof data === "object" && data !== null && "url" in data) {
      return typeof (data as { url?: unknown }).url === "string" ? (data as { url: string }).url : undefined;
    }
    return undefined;
  } catch (e) {
    Logger.error("Failed to fetch meme thumbnail:", e);
    return undefined;
  }
}

export async function sendDailyGoonReminder(client: Client): Promise<boolean> {
  try {
    const configHandler = ConfigHandler.getInstance();
    const moduleEnv = configHandler.getModuleEnv("goonreal");
    const goonRealTimeRole = moduleEnv?.goonRealTimeRole;
    const goonRealTimeChannel = moduleEnv?.goonRealTimeChannel;

    if (!goonRealTimeRole || !goonRealTimeChannel) {
      Logger.error("Goon real time role or channel not configured");
      return false;
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

    Logger.info("Daily goon reminder sent successfully");
    return true;
  } catch (error) {
    Logger.error("Error sending daily goon reminder:", error);
    return false;
  }
}

export async function scheduleNextGoon(client: Client) {
  if (scheduledTask) scheduledTask.destroy();

  const configHandler = ConfigHandler.getInstance();
  const moduleEnv = configHandler.getModuleEnv("goonreal");
  const goonRealTimeRole = moduleEnv?.goonRealTimeRole;
  const goonRealTimeChannel = moduleEnv?.goonRealTimeChannel;

  if (!goonRealTimeRole || !goonRealTimeChannel) {
    Logger.error("Goon real time role or channel not configured");
    return;
  }

  const nextTime = getRandomTimeFromNow();
  Logger.info(
    `Next goon reminder will be sent at: ${nextTime.toLocaleString()}`
  );

  const cronString = dateToCron(nextTime);

  scheduledTask = cron.schedule(cronString, async () => {
    await sendDailyGoonReminder(client);
    scheduleNextGoon(client);
  });

  Logger.info(
    `Daily goon reminder cron job scheduled for ${nextTime.toLocaleString()} (${cronString})`
  );
}

export default new Event(
  "ready",
  async client => {
    try {
      await scheduleNextGoon(client);
    } catch (error) {
      Logger.error("Error setting up daily goon event:", error);
    }
  },
  "goonreal",
  true
);
