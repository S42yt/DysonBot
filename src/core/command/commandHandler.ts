import { Collection, REST, Routes, PermissionFlagsBits } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import { BotClient, Command } from "../../types/discord.js";
import Logger from "../../utils/logger.js";
import ConfigHandler from "../../utils/configHandler.js";

class CommandHandler {
  private client: BotClient;
  private configHandler: ConfigHandler;

  constructor(client: BotClient) {
    this.client = client;
    this.configHandler = ConfigHandler.getInstance();
    this.client.commands = new Collection<string, Command>();
  }

  private getPermissionName(permissionValue: string): string {
    for (const [key, value] of Object.entries(PermissionFlagsBits)) {
      if (value.toString() === permissionValue) {
        return key;
      }
    }
    return "Unknown Permission";
  }

  public async loadCommand(
    moduleName: string,
    commandPath: string
  ): Promise<Command | null> {
    try {
      if (!this.configHandler.isModuleEnabled(moduleName)) {
        return null;
      }

      const commandFile = await import(commandPath);
      const command = commandFile.default || commandFile;

      if (!command.builder || !command.execute) {
        Logger.warn(`Command at ${commandPath} is missing builder or execute property`);
        return null;
      }

      // Get command name from the builder which is the authoritative source
      const commandName = command.builder.name;
      if (!commandName) {
        Logger.warn(`Command at ${commandPath} has no name defined in builder`);
        return null;
      }
      
      // Store the name in the command object for easier access
      command.name = commandName;
      
      if (!this.configHandler.isCommandEnabled(moduleName, commandName)) {
        return null;
      }

      command.module = moduleName;
      this.client.commands.set(commandName, command);
      return command;
    } catch (error) {
      Logger.error(
        `Error loading command: ${path.basename(commandPath)}`,
        error
      );
      return null;
    }
  }

  public async loadCommandsFromModule(
    moduleName: string,
    moduleDir: string
  ): Promise<Collection<string, Command>> {
    const commands = new Collection<string, Command>();

    if (!this.configHandler.isModuleEnabled(moduleName)) {
      return commands;
    }

    const commandsDir = path.join(moduleDir, "command");

    try {
      if (!readdirSync(commandsDir, { withFileTypes: true }).length) {
        return commands;
      }

      const commandFiles = readdirSync(commandsDir).filter(
        file => file.endsWith(".js") || file.endsWith(".ts")
      );

      for (const file of commandFiles) {
        const commandPath = path.join(commandsDir, file);
        const command = await this.loadCommand(moduleName, commandPath);

        if (command) {
          commands.set(command.name, command);
        }
      }

      if (commands.size > 0) {
        Logger.info(`Loaded ${commands.size} command(s) from ${moduleName}`);
      }
      return commands;
    } catch (error) {
      return commands;
    }
  }

  public async registerCommands(): Promise<void> {
    const config = this.configHandler.getConfig();

    if (!config.token || !config.clientId || !config.guildId) {
      throw new Error("Missing required config values");
    }

    const rest = new REST({ version: "10" }).setToken(config.token);

    const commands = Array.from(this.client.commands.values()).map(command => {
      // Get the JSON data from the builder for API submission
      const jsonData = command.builder.toJSON();
      
      // Log the permission information if available
      if (jsonData.default_member_permissions) {
        const permName = this.getPermissionName(jsonData.default_member_permissions);
        Logger.info(`Command "${jsonData.name}" requires permission: ${permName} (${jsonData.default_member_permissions})`);
      } else {
        Logger.info(`Command "${jsonData.name}" has no permission restrictions`);
      }
      
      return jsonData;
    });

    if (commands.length === 0) {
      Logger.warn("No commands to register");
      return;
    }

    try {
      Logger.info(`Registering ${commands.length} application commands`);
      
      Logger.info("Clearing existing commands...");
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: [] }
      );
      
      Logger.info("Registering updated commands...");
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );

      Logger.info(`Successfully registered ${commands.length} commands`);
    } catch (error) {
      Logger.error("Failed to register commands:", error);
      throw error;
    }
  }
}

export default CommandHandler;
