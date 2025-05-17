import { readFileSync } from 'fs';
import { join } from 'path';
import { BotConfig } from '../types/config.js';
import Logger from './logger.js';

class ConfigHandler {
  private static instance: ConfigHandler;
  private config: BotConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = join(process.cwd(), 'config.nix');
  }

  public static getInstance(): ConfigHandler {
    if (!ConfigHandler.instance) {
      ConfigHandler.instance = new ConfigHandler();
    }
    return ConfigHandler.instance;
  }

  private parseNixConfig(content: string): BotConfig {
    Object.entries(process.env).forEach(([key, value]) => {
      if (value) {
        content = content.replace(new RegExp(`\\$${key}`, 'g'), value);
      }
    });

    return this.basicParseNixConfig(content);
  }

  private basicParseNixConfig(content: string): BotConfig {
    try {
      let cleanContent = content.replace(/#.*$/gm, '').replace(/\/\/.*$/gm, '');

      cleanContent = cleanContent.replace(/}(\s*){/g, '},\n$1{');

      let jsonLike = cleanContent
        .replace(/(\w+)\s*=/g, '"$1":')
        .replace(/;/g, ',')
        .replace(/\$\{([^}]+)\}/g, '"$1"');

      jsonLike = jsonLike.replace(/,(\s*[}\]])/g, '$1');

      const jsonStr = jsonLike.trim().startsWith('{')
        ? jsonLike
        : `{${jsonLike}}`;

      return JSON.parse(jsonStr) as BotConfig;
    } catch (error) {
      Logger.error('Error parsing config:', error);
      throw new Error('Failed to parse config file');
    }
  }

  public loadConfig(forceReload = false): BotConfig {
    try {
      if (this.config && !forceReload) {
        return this.config;
      }

      const nixContent = readFileSync(this.configPath, 'utf-8');
      this.config = this.parseNixConfig(nixContent);

      if (forceReload) {
        Logger.info('Config reloaded');
      }
      return this.config;
    } catch (error) {
      Logger.error('Failed to load config:', error);
      throw new Error('Failed to load config');
    }
  }

  public getConfig(forceReload = false): BotConfig {
    if (!this.config || forceReload) {
      return this.loadConfig(forceReload);
    }
    return this.config;
  }

  public reloadConfig(): BotConfig {
    return this.getConfig(true);
  }

  public getModuleConfig(moduleName: string) {
    const config = this.getConfig();
    const moduleConfig = config.modules.find(m => m.name === moduleName);

    if (!moduleConfig) {
      return {
        name: moduleName,
        enabled: false,
        commands: {} as Record<string, boolean>,
        events: {} as Record<string, boolean>,
        env: {},
        options: {},
      };
    }

    return {
      name: moduleConfig.name,
      enabled: moduleConfig.enabled ?? false,
      commands: moduleConfig.commands ?? ({} as Record<string, boolean>),
      events: moduleConfig.events ?? ({} as Record<string, boolean>),
      env: moduleConfig.env ?? {},
      options: moduleConfig.options ?? {},
    };
  }

  public isModuleEnabled(moduleName: string): boolean {
    const moduleConfig = this.getModuleConfig(moduleName);
    return moduleConfig.enabled;
  }

  public isCommandEnabled(moduleName: string, commandName: string): boolean {
    const moduleConfig = this.getModuleConfig(moduleName);

    if (!moduleConfig.enabled) return false;

    if (!moduleConfig.commands || !(commandName in moduleConfig.commands)) {
      return true;
    }

    return !!moduleConfig.commands[commandName];
  }

  public isEventEnabled(moduleName: string, eventName: string): boolean {
    const moduleConfig = this.getModuleConfig(moduleName);

    if (!moduleConfig.enabled) return false;

    if (!moduleConfig.events || !(eventName in moduleConfig.events)) {
      return true;
    }

    return !!moduleConfig.events[eventName];
  }

  public getModuleEnv(moduleName: string): Record<string, string> {
    const moduleConfig = this.getModuleConfig(moduleName);
    return moduleConfig.env || {};
  }
}

export default ConfigHandler;
