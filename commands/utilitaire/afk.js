const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../data/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Marque-toi comme absent')
    .addStringOption(o => o.setName('raison').setDescription('Raison de l\'absence')),
  async execute(interaction) {
    const raison = interaction.options.getString('raison') || 'Absent';
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO afk (guildId, userId, reason, since) VALUES (?, ?, ?, ?)').run(
      interaction.guildId, interaction.user.id, raison, now
    );
    const embed = new EmbedBuilder()
      .setColor(0x95A5A6).setTitle('💤 AFK')
      .setDescription(`Tu es maintenant AFK : **${raison}**`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
