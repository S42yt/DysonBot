import { Client, Collection, ClientEvents } from "discord.js";
import {
  Command,
  Event,
  Module as ModuleInterface,
} from "../../types/discord.js";

class Module implements ModuleInterface {
  public readonly name: string;
  public readonly description: string;
  public readonly commands: Collection<string, Command>;
  public readonly events: Collection<string, Event<keyof ClientEvents>>;
  public readonly init?: (client: Client) => Promise<void>;
  public enabled: boolean;

  constructor(options: {
    name: string;
    description: string;
    commands?: Collection<string, Command>;
    events?: Collection<string, Event<keyof ClientEvents>>;
    init?: (client: Client) => Promise<void>;
    enabled?: boolean;
  }) {
    this.name = options.name;
    this.description = options.description;
    this.commands = options.commands || new Collection<string, Command>();
    this.events = options.events || new Collection<string, Event<keyof ClientEvents>>();
    this.init = options.init;
    this.enabled = options.enabled ?? false;
  }
}

export default Module;
