const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createGiveaway } = require('../../data/giveaways');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Lance un giveaway')
    .addStringOption(o => o.setName('prix').setDescription('Le prix à gagner').setRequired(true))
    .addStringOption(o => o.setName('duree').setDescription('Durée (ex: 10m, 1h, 1d)').setRequired(true))
    .addIntegerOption(o => o.setName('gagnants').setDescription('Nombre de gagnants').setMinValue(1).setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const prize = interaction.options.getString('prix');
    const dur = interaction.options.getString('duree');
    const winners = interaction.options.getInteger('gagnants') || 1;
    const match = dur.match(/^(\d+)(m|h|d)$/);
    if (!match) return interaction.reply({ content: '❌ Format: 10m, 1h, 2d', ephemeral: true });
    const mult = { m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(match[1]) * mult[match[2]];
    if (ms < 60000) return interaction.reply({ content: '❌ Minimum 1 minute.', ephemeral: true });
    const endTime = new Date(Date.now() + ms);
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6).setTitle('🎉 Giveaway').setDescription(`**${prize}**`)
      .addFields({ name: 'Gagnants', value: `${winners}`, inline: true }, { name: 'Fin', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true })
      .setFooter({ text: 'Réagis avec 🎉 pour participer !' });
    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('🎉');
    createGiveaway(msg.id, interaction.guildId, interaction.channelId, prize, winners, endTime);
  },
};
