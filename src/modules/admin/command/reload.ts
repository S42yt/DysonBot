import { CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command, ModuleHandler } from '../../../core';
import { Embed } from '../../../types/embed';
import { BotClient } from '../../../types/discord';
import ConfigHandler from '../../../utils/configHandler';
import Logger from '../../../utils/logger';
import path from 'path';

export default new Command(
  {
    name: 'reload',
    description: 'Reload modules, configuration, or both',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
      {
        name: 'module',
        description: 'The module name to reload (leave empty for all modules)',
        type: 3,
        required: false,
      },
      {
        name: 'config',
        description: 'Whether to reload the configuration',
        type: 5,
        required: false,
      },
    ],
  },
  async (interaction: CommandInteraction) => {
    const moduleName = interaction.options.get('module')?.value as
      | string
      | undefined;
    const reloadConfig =
      (interaction.options.get('config')?.value as boolean) || false;
    const client = interaction.client as BotClient;

    await interaction.deferReply({ ephemeral: true });

    try {
      const configHandler = ConfigHandler.getInstance();
      let configReloaded = false;
      let modulesReloaded = false;
      const results = [];

      if (reloadConfig) {
        try {
          configHandler.reloadConfig();
          configReloaded = true;
          results.push('Configuration reloaded successfully');
          Logger.info('Configuration reloaded via admin command');
        } catch (error) {
          Logger.error('Failed to reload configuration:', error);
          results.push(
            `⚠️ Failed to reload configuration: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      if (moduleName || (!reloadConfig && !moduleName)) {
        try {
          const moduleHandler = new ModuleHandler(client);

          if (moduleName) {
            moduleHandler.unloadModule(moduleName);

            const moduleDir = path.join(
              process.cwd(),
              'src',
              'modules',
              moduleName
            );

            try {
              const module = await moduleHandler.loadModule(moduleDir);

              if (module) {
                await moduleHandler.registerCommands();
                modulesReloaded = true;
                results.push(`Module \`${moduleName}\` reloaded successfully`);
                Logger.info(
                  `Module '${moduleName}' reloaded via admin command`
                );
              } else {
                results.push(
                  `⚠️ Failed to reload module \`${moduleName}\`. Module not found.`
                );
                Logger.warn(
                  `Module '${moduleName}' not found during reload command`
                );
              }
            } catch (error) {
              Logger.error(`Error reloading module '${moduleName}':`, error);
              results.push(
                `⚠️ Failed to reload module \`${moduleName}\`: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          } else {
            try {
              client.modules.forEach((_, moduleName) => {
                moduleHandler.unloadModule(moduleName);
              });

              await moduleHandler.loadAllModules();
              await moduleHandler.registerCommands();
              modulesReloaded = true;
              results.push('All modules reloaded successfully');
              Logger.info('All modules reloaded via admin command');
            } catch (error) {
              Logger.error('Error reloading all modules:', error);
              results.push(
                `⚠️ Failed to reload all modules: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }
        } catch (error) {
          Logger.error('Error creating ModuleHandler:', error);
          results.push(
            `⚠️ Module handler error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      if (results.length > 0) {
        const hasErrors = results.some(result => result.includes('⚠️'));

        await interaction.editReply({
          embeds: [
            hasErrors
              ? Embed.warning(results.join('\n'), 'Reload Partially Successful')
              : Embed.success(results.join('\n'), 'Reload Successful'),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            Embed.error(
              'Nothing was reloaded. Please specify a module or enable config reload.',
              'No Action Taken'
            ),
          ],
        });
      }
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
