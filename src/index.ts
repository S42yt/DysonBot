import createBotClient from './bot.js';
import { ModuleHandler } from './core/index.js';
import Logger from './utils/logger.js';
import ConfigHandler from './utils/configHandler.js';
import dotenv from 'dotenv';
import './utils/logs.js';

dotenv.config();

process.on('unhandledRejection', error => {
  Logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  Logger.error('Uncaught exception:', error);
  process.exit(1);
});

async function startBot() {
  try {
    Logger.info('Starting bot initialization...');

    const configHandler = ConfigHandler.getInstance();
    const config = configHandler.getConfig();

    const client = createBotClient();

    const moduleHandler = new ModuleHandler(client);

    await moduleHandler.loadAllModules();

    await moduleHandler.registerCommands();

    if (!config.token) {
      throw new Error('Bot token is missing in configuration');
    }

    await client.login(config.token);
    Logger.info(`Bot logged in successfully as ${client.user?.tag}`);

    return client;
  } catch (error) {
    Logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

startBot()
  .then(() => Logger.info('Bot initialization completed successfully'))
  .catch(error => {
    Logger.error('Bot initialization failed:', error);
    process.exit(1);
  });
