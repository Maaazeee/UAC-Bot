const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createTicket } = require('../../data/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gère les tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('panel').setDescription('Envoie le panneau de ticket'))
    .addSubcommand(s => s.setName('close').setDescription('Ferme le ticket actuel')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'panel') {
      const embed = new EmbedBuilder()
        .setColor(0x3498DB).setTitle('🎫 Support')
        .setDescription('Clique sur le bouton pour ouvrir un ticket.');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_open').setLabel('📩 Ouvrir un ticket').setStyle(ButtonStyle.Primary)
      );
      await interaction.reply({ embeds: [embed], components: [row] });
    }
    if (sub === 'close') {
      const ticket = require('../../data/tickets').getTicket(interaction.channelId);
      if (!ticket) return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
      require('../../data/tickets').closeTicket(interaction.channelId);
      await interaction.reply({ content: '🔒 Ticket fermé. Suppression dans 5s...' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  },
};
