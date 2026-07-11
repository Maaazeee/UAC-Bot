const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Gérer les avertissements')
    .addSubcommand(sub =>
      sub.setName('ajouter')
        .setDescription('Ajouter un avertissement à un membre')
        .addUserOption(opt =>
          opt.setName('membre')
            .setDescription('Le membre à avertir')
            .setRequired(true),
        )
        .addStringOption(opt =>
          opt.setName('raison')
            .setDescription('Raison de l\'avertissement'),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Voir les avertissements d\'un membre')
        .addUserOption(opt =>
          opt.setName('membre')
            .setDescription('Le membre concerné')
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Effacer tous les avertissements d\'un membre')
        .addUserOption(opt =>
          opt.setName('membre')
            .setDescription('Le membre concerné')
            .setRequired(true),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const { addWarn, getWarns, clearWarns } = require('../../data/warns');
    const membre = interaction.options.getMember('membre');
    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

    if (interaction.options.getSubcommand() === 'ajouter') {
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      const total = addWarn(membre.id, interaction.user.id, raison, interaction.guildId);

      let autoAction = '';

      const { get } = require('../../data/config');
      const strikeTimeout = get(interaction.guildId, 'strikeTimeout');
      const strikeBan = get(interaction.guildId, 'strikeBan');

      if (strikeBan && total >= strikeBan.warns && membre.bannable) {
        await membre.ban({ reason: `Ban automatique - ${total} warns` });
        autoAction = '\n🔨 **Ban automatique** appliqué.';
      } else if (strikeTimeout && total >= strikeTimeout.warns && membre.moderatable) {
        await membre.timeout(strikeTimeout.durée * 60000, `Timeout automatique - ${total} warns`);
        autoAction = `\n⏳ **Timeout ${strikeTimeout.durée} min** appliqué.`;
      }

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Avertissement')
        .setDescription(`**${membre.user.tag}** a reçu un avertissement.${autoAction}`)
        .addFields(
          { name: 'Raison', value: raison },
          { name: 'Total', value: `${total} avertissement(s)` },
        )
        .setColor(0xFFA500)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() === 'liste') {
      const warns = getWarns(membre.id, interaction.guildId);

      if (warns.length === 0) {
        return interaction.reply({ content: `✅ **${membre.user.tag}** n'a aucun avertissement.`, ephemeral: true });
      }

      const lignes = warns.map(w =>
        `#${w.id} — ${w.raison} (par <@${w.auteur}>, ${new Date(w.date).toLocaleDateString('fr-FR')})`
      );

      const embed = new EmbedBuilder()
        .setTitle(`⚠️ Avertissements de ${membre.user.tag}`)
        .setDescription(lignes.join('\n'))
        .setColor(0xFFA500);
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() === 'clear') {
      clearWarns(membre.id, interaction.guildId);
      const embed = new EmbedBuilder()
        .setTitle('✅ Avertissements effacés')
        .setDescription(`Tous les avertissements de **${membre.user.tag}** ont été effacés.`)
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }
  },
};
