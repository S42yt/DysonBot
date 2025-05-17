import {
  CommandInteraction,
  PermissionFlagsBits,
  MessageFlags,
  AttachmentBuilder
} from "discord.js";
import { Command } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import path from "path";
import fs from "fs";

export default new Command(
  {
    name: "regeln",
    description: "Sendet eine Embed-Nachricht mit den Serverregeln",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    dmPermission: false,
  },
  async (interaction: CommandInteraction) => {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
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
        embeds: [Embed.error("This channel type doesn't support sending messages", "Error")],
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
      
      const targetUser = await interaction.client.users.fetch("777516207984607273")
        .catch(() => null);
      
      const imagePath = path.join(process.cwd(), "assets", "regeln.gif");
      
      if (!fs.existsSync(imagePath)) {
        Logger.error(`Image not found at ${imagePath}`);
        await interaction.editReply({
          embeds: [Embed.error("Rules image not found in assets folder", "Error")],
        });
        return;
      }
      
      const attachment = new AttachmentBuilder(imagePath, {
        name: "regeln.gif",
      });
      
      const rulesEmbed = new Embed({
        title: "Dyson Discord Regeln :sparkles:",
        description: 
          "- 1. Keine NSFW inhalte in jeglicher form :angry: \n\n" +
          "- 2. Spammen ist auch uncool :broken_heart:\n\n" +
          "- 3. Sei kein bastard :thumbsup:\n\n" +
          "- 4. Seit nett zueinander :smiling_face_with_3_hearts:\n\n" +
          "- 5. Halt dich an die Discord ToS uwu\n\n" +
          "Oki das wars >w<",
        color: "#EB94E3",
        thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
        image: "attachment://regeln.gif", 
        footer: {
          text: targetUser ? targetUser.username : "Dyson Clan",
          iconURL: targetUser ? targetUser.displayAvatarURL({ size: 128 }) : undefined,
        },
      });
      
      await channel.send({ 
        embeds: [rulesEmbed],
        files: [attachment]
      });
      
      await interaction.editReply({
        embeds: [Embed.success("Rules message has been sent", "Success")],
      });
      
      const channelName = "name" in channel ? channel.name : "unknown";
      Logger.info(
        `Admin ${interaction.user.tag} used the regeln command in #${channelName} (${channel.id})`
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
  },
  "admin"
);