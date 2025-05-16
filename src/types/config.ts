export interface ConfigModule {
  name: string;
  enabled: boolean;
  commands?: Record<string, boolean>;
  events?: Record<string, boolean>;
  env?: Record<string, string>;
  options?: Record<string, any>;
}

export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  modules: ConfigModule[];
  debug?: boolean;
}

export interface ModuleConfig {
  name: string;
  enabled: boolean;
  commands: Record<string, boolean>;
  events: Record<string, boolean>;
  env: Record<string, string>;
  options?: Record<string, any>;
}
