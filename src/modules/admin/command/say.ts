import {
  CommandInteraction,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";

class SayCommand {
  public readonly name = "say";
  public readonly module = "admin";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Make the bot say a message")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("The message to send")
        .setRequired(true)
    );

  public async execute(interaction: CommandInteraction): Promise<void> {
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

    const message = (
      interaction.options as CommandInteractionOptionResolver
    ).getString("message");

    if (!message) {
      await interaction.reply({
        embeds: [Embed.error("Please provide a message to send", "Error")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = interaction.channel;

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "This command can only be used in text channels",
            "Error"
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!("send" in channel)) {
      await interaction.reply({
        embeds: [
          Embed.error("Cannot send messages to this channel type", "Error"),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        Embed.success(
          "Your message will be sent to the channel",
          "Message Sending"
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

    try {
      await channel.send(message);

      const channelName = "name" in channel ? channel.name : "unknown";
      Logger.info(
        `Admin ${interaction.user.tag} used the say command in #${channelName} (${channel.id})`
      );
    } catch (error) {
      Logger.error("Error in say command:", error);

      await interaction.editReply({
        embeds: [
          Embed.error(
            `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
            "Error"
          ),
        ],
      });
    }
  }
}

export default new SayCommand();
