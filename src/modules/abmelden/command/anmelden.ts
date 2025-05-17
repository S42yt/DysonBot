import { 
  CommandInteraction, 
  GuildMember, 
  SlashCommandBuilder 
} from "discord.js";
import { Embed } from "../../../types/embed.js";
import { MemberStatusModel } from "../schema/memberStatus.js";
import Logger from "../../../utils/logger.js";
import ConfigHandler from "../../../utils/configHandler.js";

class AnmeldenCommand {
  public readonly name = "anmelden";
  public readonly module = "abmelden";

  public builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Markiere dich als zurückgekehrt/anwesend");

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
      const member = interaction.member as GuildMember;
      const configHandler = ConfigHandler.getInstance();
      const moduleEnv = configHandler.getModuleEnv("abmelden");
      const clanRoleId = moduleEnv.role;

      if (!member.roles.cache.has(clanRoleId)) {
        await interaction.reply({
          embeds: [
            new Embed({
              title: "❌ Fehlende Berechtigung",
              description:
                "Du hast nicht die erforderliche Rolle, um diesen Befehl zu verwenden.",
              color: "#ED4245",
            }),
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      let memberStatus = await MemberStatusModel.findOne({ userId: member.id });

      if (!memberStatus) {
        memberStatus = new MemberStatusModel({
          userId: member.id,
          displayName: member.displayName,
          username: member.user.username,
          status: "angemeldet",
        });
        await memberStatus.save();

        const embed = new Embed({
          title: "✅ Erfolgreich angemeldet",
          description: "Du bist jetzt als anwesend markiert.",
          color: "#43B581",
        });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (memberStatus.status === "angemeldet") {
        const embed = new Embed({
          title: "ℹ️ Bereits angemeldet",
          description: "Du bist bereits als anwesend markiert.",
          color: "#5865F2",
        });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      memberStatus.status = "angemeldet";
      memberStatus.reason = undefined;
      memberStatus.endTime = undefined;
      memberStatus.displayName = member.displayName;
      memberStatus.username = member.user.username;

      await memberStatus.save();

      const embed = new Embed({
        title: "✅ Erfolgreich angemeldet",
        description: "Du wurdest erfolgreich zurückgemeldet.",
        color: "#43B581",
      });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error("Error in anmelden command:", error);

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

export default new AnmeldenCommand();
