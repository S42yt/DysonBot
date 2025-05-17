import {
  CommandInteraction,
  Guild,
  Role,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import { MemberStatusModel } from "../schema/memberStatus.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";
import { formatDuration } from "../../../utils/durationHandler.js";

class AbmeldungenCommand {
  public readonly name = "abmeldungen";
  public readonly module = "abmelden";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Zeige alle Mitglieder mit ihrem aktuellen Status an")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
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

      const guild = interaction.guild as Guild;
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("abmelden");
      const clanRoleId = moduleEnv.role;

      await interaction.deferReply();

      const clanRole = (await guild.roles.fetch(clanRoleId)) as Role;
      const clanMembers = clanRole.members;

      const memberStatuses = await MemberStatusModel.find({
        userId: { $in: Array.from(clanMembers.keys()) },
      });

      const statusMap = new Map(
        memberStatuses.map((status) => [status.userId, status])
      );

      const angemeldetFields = [];
      const abgemeldetFields = [];

      const now = new Date();

      for (const [userId, guildMember] of clanMembers) {
        const status = statusMap.get(userId) || {
          status: "angemeldet",
          displayName: guildMember.displayName,
          username: guildMember.user.username,
        };

        if (!statusMap.has(userId)) {
          const newStatus = new MemberStatusModel({
            userId,
            displayName: guildMember.displayName,
            username: guildMember.user.username,
            status: "angemeldet",
          });
          await newStatus.save();
        }

        if (status.status === "abgemeldet" && status.endTime) {
          const remainingTime = status.endTime.getTime() - now.getTime();
          const timeLeft =
            remainingTime > 0 ? formatDuration(remainingTime) : "Überfällig";

          abgemeldetFields.push({
            name: `${guildMember.displayName} (${guildMember.user.username})`,
            value: `Grund: ${status.reason}\nZurück in: ${timeLeft}`,
            inline: false,
          });
        } else {
          angemeldetFields.push({
            name: `${guildMember.displayName} (${guildMember.user.username})`,
            value: "Anwesend",
            inline: true,
          });
        }
      }

      angemeldetFields.sort((a, b) => a.name.localeCompare(b.name));
      abgemeldetFields.sort((a, b) => a.name.localeCompare(b.name));

      const embeds = [];

      embeds.push(
        new Embed({
          title: "👥 Clan Mitglieder Status",
          description: `Insgesamt: ${clanMembers.size} Mitglieder | 🟢 ${angemeldetFields.length} Anwesend | 🔴 ${abgemeldetFields.length} Abwesend`,
          color: "#43B581",
          timestamp: true,
        })
      );

      if (abgemeldetFields.length > 0) {
        for (let i = 0; i < abgemeldetFields.length; i += 25) {
          embeds.push(
            new Embed({
              title:
                i === 0
                  ? "🔴 Abwesende Mitglieder"
                  : "🔴 Abwesende Mitglieder (Fortsetzung)",
              fields: abgemeldetFields.slice(i, i + 25),
              color: "#ED4245",
            })
          );
        }
      }

      if (angemeldetFields.length > 0) {
        for (let i = 0; i < angemeldetFields.length; i += 25) {
          embeds.push(
            new Embed({
              title:
                i === 0
                  ? "🟢 Anwesende Mitglieder"
                  : "🟢 Anwesende Mitglieder (Fortsetzung)",
              fields: angemeldetFields.slice(i, i + 25),
              color: "#43B581",
            })
          );
        }
      }

      await interaction.editReply({ embeds: embeds.slice(0, 10) });
    } catch (error) {
      Logger.error("Error in abmeldungen command:", error);

      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [
            new Embed({
              title: "❌ Datenbankfehler",
              description:
                "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
              color: "#ED4245",
            }),
          ],
        });
      } else {
        await interaction.reply({
          embeds: [
            new Embed({
              title: "❌ Datenbankfehler",
              description:
                "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
              color: "#ED4245",
            }),
          ],
          ephemeral: true,
        });
      }
    }
  }
}

export default new AbmeldungenCommand();
