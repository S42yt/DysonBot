import { Client } from 'discord.js';
import Logger from '../../utils/logger.js';

export default {
  name: 'admin',
  description: 'Administrative commands for managing the bot',

  init: async (client: Client): Promise<void> => {
    Logger.info(
      `Admin module initialized for ${client.user?.tag || 'unknown'}`
    );
  },
};
