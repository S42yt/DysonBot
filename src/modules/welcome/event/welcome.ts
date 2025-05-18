import { GuildMember, AttachmentBuilder, TextChannel } from "discord.js";
import { Event } from "../../../core/index.js";
import { Embed } from "../../../types/embed.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";

const fontPath = path.join(process.cwd(), "assets", "Minecraft.ttf");
try {
  registerFont(fontPath, { family: "Minecraft" });
  Logger.info("Minecraft font registered successfully");
} catch (error) {
  Logger.error(`Failed to register Minecraft font: ${error}`);
}

export default new Event(
  "guildMemberAdd",
  async (member: GuildMember) => {
    try {
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("welcome");
      const welcomeChannelId = moduleEnv.welcomeChannel;

      if (!welcomeChannelId) {
        Logger.error("Welcome channel ID is not configured");
        return;
      }

      const welcomeChannel = member.guild.channels.cache.get(
        welcomeChannelId
      ) as TextChannel;
      if (!welcomeChannel || !welcomeChannel.isTextBased()) {
        Logger.error(
          `Welcome channel ${welcomeChannelId} not found or not a text channel`
        );
        return;
      }

      const welcomeImageBuffer = await generateWelcomeImage(member);
      const attachment = new AttachmentBuilder(welcomeImageBuffer, {
        name: "welcome.png",
      });

      const embed = new Embed({
        title: `Willkommen auf ${member.guild.name} Discord!!!`,
        description: `Hey <@${member.id}>, schön, dass du bei uns bist! Wenn du ein Clan Mitglied bist einmal bei NurBirkenBaum melden!!!.`,
        color: "#C593AE",
        thumbnail: member.user.displayAvatarURL({ size: 128 }),
        image: "attachment://welcome.png",
        footer: {
          text: `Member #${member.guild.memberCount}`,
        },
        timestamp: true,
      });

      await welcomeChannel.send({
        embeds: [embed],
        files: [attachment],
      });

      Logger.info(`Sent welcome message for ${member.user.tag}`);
    } catch (error) {
      Logger.error("Error in welcome event:", error);
    }
  },
  "welcome"
);

async function generateWelcomeImage(member: GuildMember): Promise<Buffer> {
  try {
    const canvas = createCanvas(1100, 500);
    const ctx = canvas.getContext("2d");

    const backgroundPath = path.join(process.cwd(), "assets", "welcome.gif");

    if (!fs.existsSync(backgroundPath)) {
      Logger.error(`Background image not found at ${backgroundPath}`);
      ctx.fillStyle = "#36393f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const background = await loadImage(backgroundPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    const radius = 20;
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(
      canvas.width,
      canvas.height,
      canvas.width - radius,
      canvas.height
    );
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const avatarSize = 200;
    const avatarX = canvas.width / 2 - avatarSize / 2;
    const avatarY = canvas.height / 2 - avatarSize / 2;

    ctx.save();

    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2,
      true
    );
    ctx.closePath();
    ctx.clip();

    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 512 })
    );
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);

    ctx.restore();

    // Update font settings to use Minecraft font
    ctx.font = "bold 40px Minecraft";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(
      "Willkommen zum Dyson Clan Discord !!!",
      canvas.width / 2,
      avatarY - 30
    );

    ctx.font = "bold 32px Minecraft"; 
    ctx.fillText(
      member.user.username,
      canvas.width / 2,
      avatarY + avatarSize + 60
    );

    ctx.font = "24px Minecraft"; 
    ctx.fillText(
      `Member #${member.guild.memberCount}`,
      canvas.width / 2,
      avatarY + avatarSize + 110
    );

    return canvas.toBuffer("image/png");
  } catch (error) {
    Logger.error("Error generating welcome image:", error);
    throw error;
  }
}
