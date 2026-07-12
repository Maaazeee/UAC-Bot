const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelrole')
    .setDescription('Configurer les rôles récompenses de niveau')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Ajouter un rôle à un niveau')
        .addIntegerOption(opt => opt.setName('niveau').setDescription('Niveau requis').setRequired(true).setMinValue(1))
        .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à attribuer').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Supprimer un rôle d\'un niveau')
        .addIntegerOption(opt => opt.setName('niveau').setDescription('Niveau concerné').setRequired(true).setMinValue(1))
        .addRoleOption(opt => opt.setName('rôle').setDescription('Rôle à supprimer').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('liste').setDescription('Voir les récompenses configurées'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { get, set } = require('../../data/config');
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const niveau = interaction.options.getInteger('niveau');
      const rôle = interaction.options.getRole('rôle');
      if (rôle.comparePositionTo(interaction.member.roles.highest) >= 0 && interaction.guild.ownerId !== interaction.user.id)
        return interaction.reply({ content: '❌ Ce rôle est trop haut pour que tu le gères.', ephemeral: true });

      const rewards = get(interaction.guildId, 'levelRewardsMulti') || {};
      if (!rewards[niveau]) rewards[niveau] = [];
      if (rewards[niveau].includes(rôle.id)) return interaction.reply({ content: '❌ Ce rôle est déjà attribué à ce niveau.', ephemeral: true });
      rewards[niveau].push(rôle.id);
      set(interaction.guildId, 'levelRewardsMulti', rewards);

      return interaction.reply({ content: `✅ Niveau **${niveau}** → ${rôle} (cumulable).` });
    }

    if (sub === 'remove') {
      const niveau = interaction.options.getInteger('niveau');
      const rôle = interaction.options.getRole('rôle');
      const rewards = get(interaction.guildId, 'levelRewardsMulti') || {};
      if (!rewards[niveau] || !rewards[niveau].includes(rôle.id))
        return interaction.reply({ content: '❌ Ce rôle n\'est pas configuré pour ce niveau.', ephemeral: true });
      rewards[niveau] = rewards[niveau].filter(id => id !== rôle.id);
      if (rewards[niveau].length === 0) delete rewards[niveau];
      set(interaction.guildId, 'levelRewardsMulti', rewards);
      return interaction.reply({ content: `✅ ${rôle} retiré des récompenses du niveau **${niveau}**.` });
    }

    const rewardsMulti = get(interaction.guildId, 'levelRewardsMulti') || {};
    const rewardsSingle = get(interaction.guildId, 'levelRewards') || {};
    const lines = [];

    const singleEntries = Object.entries(rewardsSingle).sort((a, b) => a[0] - b[0]);
    for (const [lvl, roleId] of singleEntries) {
      lines.push(`• Niveau **${lvl}** → <@&${roleId}>`);
    }

    const multiEntries = Object.entries(rewardsMulti).sort((a, b) => a[0] - b[0]);
    for (const [lvl, roleIds] of multiEntries) {
      const roles = roleIds.map(id => `<@&${id}>`).join(', ');
      lines.push(`• Niveau **${lvl}** → ${roles} *(cumulable)*`);
    }

    if (!lines.length) return interaction.reply({ content: '📭 Aucune récompense configurée.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('🎖️ Récompenses de niveau')
      .setDescription(lines.join('\n'))
      .setColor(0xFFD700);
    await interaction.reply({ embeds: [embed] });
  },
};
