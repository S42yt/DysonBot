import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";
import CounterModel from "../schema/memberCounter.js";

class SetupCommand {
  public readonly name = "setup";
  public readonly module = "admin";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Setup server features and configurations")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("counterchannel")
        .setDescription("Creates a channel that shows the member count")
        .addStringOption(option =>
          option
            .setName("format")
            .setDescription(
              "Format of the channel name (use {count} as placeholder)"
            )
            .setRequired(false)
        )
    );
  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "You do not have permission to use this command.",
            "Permission Denied"
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!interaction.guild) {
      await interaction.reply({
        embeds: [
          Embed.error("This command can only be used in a server", "Error"),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "counterchannel") {
      await this.setupCounterChannel(interaction);
    }
  }
  private async setupCounterChannel(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const format =
      interaction.options.getString("format") || "「👥」Mitglieder✩ {count}";

    try {
      const guild = interaction.guild!;
      const memberCount = guild.memberCount;
      const channelName = format.replace("{count}", memberCount.toString());

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
          {
            id: guild.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
      });

      // Save configuration directly to MongoDB
      await CounterModel.createOrUpdateCounter(guild.id, channel.id, format);

      // Update environment variables only as a fallback
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("admin");
      if (moduleEnv && typeof moduleEnv === "object") {
        moduleEnv.counterChannelId = channel.id;
        moduleEnv.counterFormat = format;
      }

      Logger.info(
        `Member counter channel set up by ${interaction.user.tag} in guild ${guild.name} with format "${format}" and initial count ${memberCount}`
      );

      await interaction.editReply({
        embeds: [
          Embed.success(
            `Created member counter channel "${channelName}" with ID ${channel.id}.\nThe channel will update every 5 minutes with the current member count.`,
            "Counter Channel Setup"
          ),
        ],
      });
    } catch (error) {
      Logger.error("Error in counter channel setup:", error);
      await interaction.editReply({
        embeds: [
          Embed.error(
            `Failed to create counter channel: ${error instanceof Error ? error.message : "Unknown error"}`,
            "Setup Failed"
          ),
        ],
      });
    }
  }
}

export default new SetupCommand();
