import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { BotClient, Module as ModuleInterface } from '../../types/discord.js';
import Logger from '../../utils/logger.js';
import ConfigHandler from '../../utils/configHandler.js';
import CommandHandler from '../command/commandHandler.js';
import EventHandler from '../event/eventHandler.js';
import Module from './module.js';

class ModuleHandler {
  private client: BotClient;
  private configHandler: ConfigHandler;
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private modulesDir: string;

  constructor(client: BotClient) {
    this.client = client;
    this.configHandler = ConfigHandler.getInstance();
    this.commandHandler = new CommandHandler(client);
    this.eventHandler = new EventHandler(client);
    this.client.modules = new Collection<string, ModuleInterface>();
    this.modulesDir = path.join(process.cwd(), 'src', 'modules');
  }

  public async unloadModule(moduleName: string): Promise<boolean> {
    try {
      const existingModule = this.client.modules.get(moduleName);
      if (!existingModule) {
        Logger.warn(`Cannot unload module ${moduleName} - module not found`);
        return false;
      }

      existingModule.commands.forEach((command, commandName) => {
        this.client.commands.delete(commandName);
        Logger.info(
          `Unloaded command: ${commandName} from module ${moduleName}`
        );
      });

      existingModule.events.forEach((event, eventName) => {
        this.client.events.delete(eventName);
        Logger.info(
          `Unregistered event: ${eventName} from module ${moduleName}`
        );
      });

      this.client.modules.delete(moduleName);

      const modulePattern = new RegExp(`${moduleName}[\\\\/]`);
      Object.keys(require.cache).forEach(key => {
        if (modulePattern.test(key)) {
          delete require.cache[key];
        }
      });

      Logger.info(`Unloaded module: ${moduleName}`);
      return true;
    } catch (error) {
      Logger.error(`Error unloading module ${moduleName}:`, error);
      return false;
    }
  }

  public async loadModule(moduleDir: string): Promise<ModuleInterface | null> {
    try {
      const moduleName = path.basename(moduleDir);

      if (this.client.modules.has(moduleName)) {
        await this.unloadModule(moduleName);
        Logger.info(`Unloaded existing module ${moduleName} for reload`);
      }

      if (!this.configHandler.isModuleEnabled(moduleName)) {
        Logger.info(`Module ${moduleName} is disabled in config, skipping`);
        return null;
      }

      const indexPath = path.join(moduleDir, 'index.ts');
      let moduleInfo: any = {
        name: moduleName,
        description: `Module ${moduleName}`,
      };

      try {
        const indexFile = await import(`${indexPath}?update=${Date.now()}`);
        const moduleExport = indexFile.default || indexFile;

        if (typeof moduleExport === 'object') {
          moduleInfo = {
            ...moduleInfo,
            ...moduleExport,
          };
        }
      } catch (error) {
        Logger.warn(
          `Could not load index file for module ${moduleName}, using defaults`
        );
      }

      const commands = await this.commandHandler.loadCommandsFromModule(
        moduleName,
        moduleDir
      );
      const events = await this.eventHandler.loadEventsFromModule(
        moduleName,
        moduleDir
      );

      const module = new Module({
        name: moduleName,
        description: moduleInfo.description,
        commands,
        events,
        init: moduleInfo.init,
        enabled: true,
      });

      if (module.init) {
        await module.init(this.client);
      }

      this.client.modules.set(moduleName, module);
      Logger.info(
        `Loaded module: ${moduleName} with ${commands.size} commands and ${events.size} events`
      );
      return module;
    } catch (error) {
      Logger.error(`Error loading module at ${moduleDir}:`, error);
      return null;
    }
  }

  public async loadAllModules(): Promise<Collection<string, ModuleInterface>> {
    try {
      const moduleFolders = readdirSync(this.modulesDir, {
        withFileTypes: true,
      })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(this.modulesDir, dirent.name));

      for (const moduleDir of moduleFolders) {
        await this.loadModule(moduleDir);
      }

      Logger.info(`Loaded ${this.client.modules.size} module(s)`);
      return this.client.modules;
    } catch (error) {
      Logger.error('Error loading modules:', error);
      return this.client.modules;
    }
  }

  public async registerCommands(): Promise<void> {
    await this.commandHandler.registerCommands();
  }
}

export default ModuleHandler;
