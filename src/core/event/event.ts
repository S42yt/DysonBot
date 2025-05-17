import { ClientEvents } from 'discord.js';
import { Event as EventInterface } from '../../types/discord.js';

class Event<K extends keyof ClientEvents> implements EventInterface<K> {
  public readonly name: K;
  public readonly once: boolean;
  public readonly execute: (...args: ClientEvents[K]) => Promise<void> | void;
  public readonly module: string;

  constructor(
    name: K,
    execute: (...args: ClientEvents[K]) => Promise<void> | void,
    module: string,
    once = false
  ) {
    this.name = name;
    this.execute = execute;
    this.module = module;
    this.once = once;
  }
}

export default Event;
