import { Client } from 'discord.js';
import Logger from '../../utils/logger';
import ConfigHandler from '../../utils/configHandler';

export default {
  name: 'misc',
  description: 'Miscellaneous utility commands',

  init: async (client: Client): Promise<void> => {
    const configHandler = ConfigHandler.getInstance();
    const moduleConfig = configHandler.getModuleConfig('misc');

    Logger.info(
      `Miscellaneous module initialized for ${client.user?.tag || 'unknown'}`
    );
    Logger.info(
      `Available commands: ${Object.keys(moduleConfig.commands || {}).join(', ') || 'All'}`
    );
    Logger.info(
      `Available events: ${Object.keys(moduleConfig.events || {}).join(', ') || 'All'}`
    );
  },
};
