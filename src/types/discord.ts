import {
  ApplicationCommandOptionData,
  Client,
  ClientEvents,
  Collection,
  CommandInteraction,
  CommandInteractionOptionResolver,
} from 'discord.js';

export interface SlashCommandOptions {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultMemberPermissions?: bigint | null;
  dmPermission?: boolean;
}

export interface CommandExecute {
  (
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver
  ): Promise<void>;
}

export interface Command {
  data: SlashCommandOptions;
  execute: CommandExecute;
  module: string;
}

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
  module: string;
}

export interface Module {
  name: string;
  description: string;
  commands: Collection<string, Command>;
  events: Collection<string, Event<any>>;
  init?: (client: Client) => Promise<void>;
  enabled: boolean;
}

export interface BotClientOptions {
  intents: number[];
}

export interface BotClient extends Client {
  commands: Collection<string, Command>;
  modules: Collection<string, Module>;
  events: Collection<string, Event<any>>;
}
