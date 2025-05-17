import { ApplicationCommandOptionData, Collection, REST, Routes } from "discord.js";
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

      if (!command.data || !command.execute) {
        return null;
      }

      const commandName = command.data.name;
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
          commands.set(command.data.name, command);
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
      
      const commandData: {
        name: string;
        description: string;
        options: ApplicationCommandOptionData[];
        dmPermission: boolean;
        defaultMemberPermissions?: string;
      } = {
        name: command.data.name,
        description: command.data.description,
        options: command.data.options || [],
        dmPermission: command.data.dmPermission ?? false
      };
      
      
      
      if (command.data.defaultMemberPermissions) {
        commandData.defaultMemberPermissions = "8";
        Logger.info(`Restricting command ${command.data.name} to administrators`);
      }
      
      return commandData;
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
