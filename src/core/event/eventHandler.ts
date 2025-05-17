import { Collection } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import { BotClient, Event } from "../../types/discord.js";
import Logger from "../../utils/logger.js";
import ConfigHandler from "../../utils/configHandler.js";

class EventHandler {
  private client: BotClient;
  private configHandler: ConfigHandler;

  constructor(client: BotClient) {
    this.client = client;
    this.configHandler = ConfigHandler.getInstance();
    this.client.events = new Collection<string, Event<any>>();
  }

  public async loadEvent(
    moduleName: string,
    eventPath: string
  ): Promise<Event<any> | null> {
    try {
      if (!this.configHandler.isModuleEnabled(moduleName)) {
        return null;
      }

      const eventFile = await import(eventPath);
      const event = eventFile.default || eventFile;

      if (!event.name || !event.execute) {
        Logger.warn(`Invalid event at ${eventPath}`);
        return null;
      }

      const eventName = event.name;
      if (!this.configHandler.isEventEnabled(moduleName, eventName)) {
        Logger.info(
          `Skipping disabled event: ${eventName} from module ${moduleName}`
        );
        return null;
      }

      event.module = moduleName;

      if (event.once) {
        this.client.once(event.name, (...args: unknown[]) =>
          event.execute(...args)
        );
      } else {
        this.client.on(event.name, (...args: unknown[]) =>
          event.execute(...args)
        );
      }

      this.client.events.set(event.name, event);
      Logger.info(`Loaded event: ${event.name} from module ${moduleName}`);
      return event;
    } catch (error) {
      Logger.error(`Error loading event at ${eventPath}:`, error);
      return null;
    }
  }

  public async loadEventsFromModule(
    moduleName: string,
    moduleDir: string
  ): Promise<Collection<string, Event<any>>> {
    const events = new Collection<string, Event<any>>();

    if (!this.configHandler.isModuleEnabled(moduleName)) {
      Logger.info(`Skipping events from disabled module: ${moduleName}`);
      return events;
    }

    const eventsDir = path.join(moduleDir, "event");

    try {
      if (!readdirSync(eventsDir, { withFileTypes: true }).length) {
        Logger.info(`No events found in module: ${moduleName}`);
        return events;
      }

      const eventFiles = readdirSync(eventsDir).filter(file =>
        file.endsWith(".js")  || file.endsWith(".ts")
      );

      for (const file of eventFiles) {
        const eventPath = path.join(eventsDir, file);
        const event = await this.loadEvent(moduleName, eventPath);

        if (event) {
          events.set(event.name, event);
        }
      }

      Logger.info(`Loaded ${events.size} event(s) from module: ${moduleName}`);
      return events;
    } catch (error) {
      Logger.warn(`No event directory found for module: ${moduleName}`);
      return events;
    }
  }
}

export default EventHandler;
