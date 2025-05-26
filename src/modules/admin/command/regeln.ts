import {
  CommandInteraction,
  PermissionFlagsBits,
  MessageFlags,
  AttachmentBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import path from "path";
import fs from "fs";

class RegelnCommand {
  public readonly name = "regeln";
  public readonly module = "admin";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Sendet eine Embed-Nachricht mit den Serverregeln")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("regel")
        .setDescription("Wähle eine spezifische Regel")
        .setRequired(false)
        .addChoices(
          { name: "Alle Regeln", value: "all" },
          { name: "Regel 1 - Keine NSFW Inhalte", value: "1" },
          { name: "Regel 2 - Kein Spammen", value: "2" },
          { name: "Regel 3 - Sei kein Bastard", value: "3" },
          { name: "Regel 4 - Seid nett zueinander", value: "4" },
          { name: "Regel 5 - Discord ToS", value: "5" }
        )
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
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.channel;

    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({
        embeds: [
          Embed.error(
            "This command can only be used in text channels",
            "Error"
          ),
        ],
      });
      return;
    }

    if (!("send" in channel)) {
      await interaction.editReply({
        embeds: [
          Embed.error(
            "This channel type doesn't support sending messages",
            "Error"
          ),
        ],
      });
      return;
    }

    try {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply({
          embeds: [Embed.error("Command must be used in a guild", "Error")],
        });
        return;
      }

      const selectedRule =
        (interaction.options.get("regel")?.value as string) || "all";
      const targetUser = await interaction.client.users
        .fetch("777516207984607273")
        .catch(() => null);

      const rules = {
        "1": {
          name: "Regel 1",
          value: "- Keine NSFW Inhalte in jeglicher Form :angry:",
        },
        "2": {
          name: "Regel 2",
          value: "- Spammen ist auch uncool :broken_heart:",
        },
        "3": { name: "Regel 3", value: "- Sei kein Bastard :thumbsup:" },
        "4": {
          name: "Regel 4",
          value: "- Seid nett zueinander :smiling_face_with_3_hearts:",
        },
        "5": { name: "Regel 5", value: "- Haltet euch an die Discord ToS uwu" },
      };

      let rulesEmbed: Embed;

      if (selectedRule === "all") {
        const imagePath = path.join(process.cwd(), "assets", "regeln.gif");

        if (!fs.existsSync(imagePath)) {
          Logger.error(`Image not found at ${imagePath}`);
          await interaction.editReply({
            embeds: [
              Embed.error("Rules image not found in assets folder", "Error"),
            ],
          });
          return;
        }

        const attachment = new AttachmentBuilder(imagePath, {
          name: "regeln.gif",
        });

        rulesEmbed = new Embed({
          title: "Dyson Discord Regeln :sparkles:",
          color: "#EB94E3",
          thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
          image: "attachment://regeln.gif",
          footer: {
            text: targetUser ? targetUser.username : "Dyson Clan",
            iconURL: targetUser
              ? targetUser.displayAvatarURL({ size: 128 })
              : undefined,
          },
          timestamp: true,
        }).addFields(
          ...Object.values(rules).map(rule => ({ ...rule, inline: false })),
          { name: "", value: "Oki das wars >w<", inline: false }
        );

        const messagePayload = rulesEmbed.toMessagePayload();

        await channel.send({
          ...messagePayload,
          files: [attachment],
        });
      } else {
        const rule = rules[selectedRule as keyof typeof rules];

        rulesEmbed = new Embed({
          title: `${rule.name} :sparkles:`,
          description: rule.value,
          color: "#EB94E3",
          thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
          footer: {
            text: targetUser ? targetUser.username : "Dyson Clan",
            iconURL: targetUser
              ? targetUser.displayAvatarURL({ size: 128 })
              : undefined,
          },
          timestamp: true,
        });

        const messagePayload = rulesEmbed.toMessagePayload();

        await channel.send({
          ...messagePayload,
        });
      }

      await interaction.editReply({
        embeds: [Embed.success("Rules message has been sent", "Success")],
      });

      const channelName = "name" in channel ? channel.name : "unknown";
      Logger.info(
        `Admin ${interaction.user.tag} used the regeln command in #${channelName} (${channel.id}) - Rule: ${selectedRule}`
      );
    } catch (error) {
      Logger.error("Error in regeln command:", error);

      await interaction.editReply({
        embeds: [
          Embed.error(
            `Failed to send rules message: ${error instanceof Error ? error.message : "Unknown error"}`,
            "Error"
          ),
        ],
      });
    }
  }
}

export default new RegelnCommand();
