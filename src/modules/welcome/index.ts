import { Client } from 'discord.js';
import Logger from '../../utils/logger';
import ConfigHandler from '../../utils/configHandler';

export default {
  name: 'welcome',
  description: 'Handles welcome messages and role assignment for new members',

  init: async (client: Client): Promise<void> => {
    const configHandler = ConfigHandler.getInstance();
    const moduleConfig = configHandler.getModuleConfig('welcome');

    Logger.info(
      `Welcome module initialized for ${client.user?.tag || 'unknown'}`
    );

    const enabledEvents = Object.entries(moduleConfig.events || {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);

    Logger.info(`Available events: ${enabledEvents.join(', ') || 'None'}`);
  },
};
