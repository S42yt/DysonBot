import {
  Command as CommandInterface,
  CommandExecute,
  SlashCommandOptions,
} from "../../types/discord.js";

class Command implements CommandInterface {
  public readonly data: SlashCommandOptions;
  public readonly execute: CommandExecute;
  public readonly module: string;

  constructor(
    options: SlashCommandOptions,
    execute: CommandExecute,
    module: string
  ) {
    this.data = options;
    this.execute = execute;
    this.module = module;
  }
}

export default Command;
