const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelset')
    .setDescription('Gérer les niveaux des membres (admin)')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Définir le nombre d\'XP d\'un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre').setRequired(true))
        .addIntegerOption(opt => opt.setName('xp').setDescription('Nouvelle valeur d\'XP').setRequired(true).setMinValue(0)),
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Réinitialiser l\'XP d\'un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('dailycap')
        .setDescription('Définir le plafond XP quotidien (0 = illimité)')
        .addIntegerOption(opt => opt.setName('limite').setDescription('XP max par jour').setRequired(true).setMinValue(0)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { setXp, resetUser } = require('../../data/levels');
    const { get, set } = require('../../data/config');
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const membre = interaction.options.getMember('membre');
      const xp = interaction.options.getInteger('xp');
      if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      const result = setXp(interaction.guildId, membre.id, xp);
      return interaction.reply({ content: `✅ **${membre.user.tag}** a maintenant **${xp}** XP (niveau ${result.level}).` });
    }

    if (sub === 'reset') {
      const membre = interaction.options.getMember('membre');
      if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      resetUser(interaction.guildId, membre.id);
      return interaction.reply({ content: `✅ XP de **${membre.user.tag}** réinitialisée.` });
    }

    const limit = interaction.options.getInteger('limite');
    set(interaction.guildId, 'xpDailyCap', limit);
    return interaction.reply({ content: `✅ Plafond XP quotidien défini à **${limit === 0 ? 'illimité' : limit + ' XP'}**.` });
  },
};
