import { Client } from 'discord.js';
import Logger from '../../utils/logger';
import ConfigHandler from '../../utils/configHandler';
import { DatabaseHandler } from '../../core';
import { MemberStatusModel } from './schema/memberStatus';

export default {
  name: 'abmelden',
  description: 'Commands for managing member absence status',

  init: async (client: Client): Promise<void> => {
    const configHandler = ConfigHandler.getInstance();
    const moduleConfig = configHandler.getModuleConfig('abmelden');

    const db = DatabaseHandler.getInstance();
    await db.connect();

    Logger.info(
      `Abmelden module initialized for ${client.user?.tag || 'unknown'}`
    );
    Logger.info(
      `Available commands: ${Object.keys(moduleConfig.commands || {}).join(', ') || 'All'}`
    );
    Logger.info(
      `Available events: ${Object.keys(moduleConfig.events || {}).join(', ') || 'All'}`
    );
  },
};
