const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Signaler un membre aux modérateurs')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à signaler')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du signalement')
        .setRequired(true),
    ),
  async execute(interaction) {
    const { addReport } = require('../../data/reports');
    const target = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison');

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te signaler toi-même.', ephemeral: true });

    addReport(interaction.guildId, target.id, interaction.user.id, raison);

    const embed = new EmbedBuilder()
      .setTitle('📝 Signalement envoyé')
      .setDescription(`**${target.user.tag}** a été signalé.`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFFA500)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    const logChannelId = require('../../data/config').get(interaction.guildId, 'logChannel');
    if (logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const alert = new EmbedBuilder()
          .setTitle('🚨 Nouveau signalement')
          .setDescription(`**Signalé:** ${target.user.tag} (${target.id})\n**Par:** ${interaction.user.tag}\n**Raison:** ${raison}`)
          .setColor(0xFF0000)
          .setTimestamp();
        await logChannel.send({ embeds: [alert] }).catch(() => {});
      }
    }
  },
};
