const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Gérer la protection anti-raid')
    .addSubcommand(sub =>
      sub.setName('on')
        .setDescription('Activer la protection anti-raid'),
    )
    .addSubcommand(sub =>
      sub.setName('off')
        .setDescription('Désactiver la protection anti-raid'),
    )
    .addSubcommand(sub =>
      sub.setName('unlock')
        .setDescription('Dévérouiller tous les salons vérouillés par l\'anti-raid'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { get, set } = require('../../data/config');

    if (interaction.options.getSubcommand() === 'on') {
      set(interaction.guildId, 'antiRaid', true);
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Anti-raid activé')
        .setDescription('100 arrivées en 10s vérouillera les salons.')
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() === 'off') {
      set(interaction.guildId, 'antiRaid', false);
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Anti-raid désactivé')
        .setColor(0xFFA500);
      return interaction.reply({ embeds: [embed] });
    }

    const locked = get(interaction.guildId, 'raidLocked') || [];
    if (locked.length === 0) return interaction.reply({ content: '✅ Aucun salon vérouillé.', ephemeral: true });

    let count = 0;
    for (const id of locked) {
      const channel = interaction.guild.channels.cache.get(id);
      if (channel) {
        try {
          await channel.permissionOverwrites.delete(interaction.guild.roles.everyone);
          count++;
        } catch {}
      }
    }
    set(interaction.guildId, 'raidLocked', []);
    const embed = new EmbedBuilder()
      .setTitle('🔓 Salons dévérouillés')
      .setDescription(`${count} salon(s) dévérouillé(s).`)
      .setColor(0x00FF00);
    await interaction.reply({ embeds: [embed] });
  },
};
