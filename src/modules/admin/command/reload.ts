import {
  CommandInteraction,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
} from 'discord.js';
import { Command, ModuleHandler } from '../../../core';
import { Embed } from '../../../types/embed';
import { BotClient } from '../../../types/discord';
import ConfigHandler from '../../../utils/configHandler';
import Logger from '../../../utils/logger';

export default new Command(
  {
    name: 'reload',
    description: 'Reload all modules and optionally configuration',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
      {
        name: 'config',
        description: 'Whether to also reload the configuration',
        type: 5,
        required: false,
      },
    ],
  },
  async (interaction: CommandInteraction) => {
    const reloadConfig =
      (interaction.options as CommandInteractionOptionResolver).getBoolean(
        'config'
      ) || false;
    const client = interaction.client as BotClient;

    await interaction.deferReply({ ephemeral: true });

    try {
      const configHandler = ConfigHandler.getInstance();
      const results = [];

      if (reloadConfig) {
        try {
          configHandler.reloadConfig();
          results.push('✅ Configuration reloaded successfully');
          Logger.info('Configuration reloaded via admin command');
        } catch (error) {
          Logger.error('Failed to reload configuration:', error);
          results.push(
            `⚠️ Failed to reload configuration: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      try {
        const moduleHandler = new ModuleHandler(client);

        client.modules.forEach((_, moduleName) => {
          moduleHandler.unloadModule(moduleName);
        });

        await moduleHandler.loadAllModules();
        await moduleHandler.registerCommands();

        results.push('✅ All modules reloaded successfully');
        Logger.info('All modules reloaded via admin command');
      } catch (error) {
        Logger.error('Error reloading modules:', error);
        results.push(
          `⚠️ Failed to reload modules: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      const hasErrors = results.some(result => result.includes('⚠️'));

      await interaction.editReply({
        embeds: [
          hasErrors
            ? Embed.warning(results.join('\n'), 'Reload Partially Successful')
            : Embed.success(results.join('\n'), 'Reload Successful'),
        ],
      });
    } catch (error) {
      Logger.error('Error in reload command:', error);

      await interaction.editReply({
        embeds: [
          Embed.error(
            `An error occurred while reloading: ${error instanceof Error ? error.message : String(error)}`,
            'Reload Failed'
          ),
        ],
      });
    }
  },
  'admin'
);
