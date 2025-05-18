import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import {
  Command as CommandInterface,
  CommandExecute,
  SlashCommandOptions,
} from "../../types/discord.js";

class Command implements CommandInterface {
  public readonly data: SlashCommandOptions;
  public readonly execute: CommandExecute;
  public readonly module: string;
  public readonly name: string;
  public readonly builder:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

  constructor(
    options: SlashCommandOptions,
    execute: CommandExecute,
    module: string
  ) {
    this.data = options;
    this.execute = execute;
    this.module = module;
    this.name = options.name;
    this.builder = new SlashCommandBuilder()
      .setName(options.name)
      .setDescription(options.description || "No description provided");
  }
}

export default Command;
