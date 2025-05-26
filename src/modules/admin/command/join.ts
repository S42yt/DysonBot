import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  GuildMember,
  VoiceChannel,
  MessageFlags,
} from "discord.js";
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";

class JoinCommand {
  public readonly name = "join";
  public readonly module = "admin";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Lässt den Bot einem Sprachkanal beitreten.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Der Sprachkanal, dem der Bot beitreten soll.")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    );

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "Dieser Befehl kann nur auf einem Server verwendet werden."
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        embeds: [
          Embed.error(
            "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
            "Fehlende Berechtigung"
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = interaction.member as GuildMember;
    let targetChannel = interaction.options?.get("channel")
      ?.channel as VoiceChannel | null;

    if (!targetChannel) {
      if (member.voice.channel) {
        targetChannel = member.voice.channel as VoiceChannel;
      } else {
        await interaction.editReply({
          embeds: [
            Embed.error(
              "Du musst in einem Sprachkanal sein oder einen Kanal angeben, dem ich beitreten soll."
            ),
          ],
        });
        return;
      }
    }

    if (targetChannel.type !== ChannelType.GuildVoice) {
      await interaction.editReply({
        embeds: [Embed.error("Der angegebene Kanal ist kein Sprachkanal.")],
      });
      return;
    }

    try {
      if (!interaction.guild) {
        await interaction.editReply({
          embeds: [Embed.error("Konnte keinen gültigen Server finden.")],
        });
        return;
      }

      const connection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      await interaction.editReply({
        embeds: [
          Embed.success(
            `Erfolgreich dem Sprachkanal **${targetChannel.name}** beigetreten.`
          ),
        ],
      });
      Logger.info(
        `Admin ${interaction.user.tag} used join command. Bot joined ${targetChannel.name} (${targetChannel.id})`
      );
    } catch (error) {
      Logger.error("Error in join command:", error);
      await interaction.editReply({
        embeds: [
          Embed.error(
            `Konnte dem Sprachkanal nicht beitreten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
          ),
        ],
      });
    }
  }
}

export default new JoinCommand();
