const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Configure la vérification par bouton')
    .addRoleOption(o => o.setName('role').setDescription('Rôle à donner après vérification').setRequired(true))
    .addChannelOption(o => o.setName('salon').setDescription('Salon où envoyer le panneau').setRequired(true))
    .addChannelOption(o => o.setName('welcomechannel').setDescription('Salon pour le message de bienvenue après vérification'))
    .addStringOption(o => o.setName('welcomemessage').setDescription('Message de bienvenue ({user} et {server} autorisés)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const channel = interaction.options.getChannel('salon');
    set(interaction.guildId, 'verifyRole', role.id);
    if (interaction.options.getChannel('welcomechannel')) set(interaction.guildId, 'verifyWelcomeChannel', interaction.options.getChannel('welcomechannel').id);
    if (interaction.options.getString('welcomemessage')) set(interaction.guildId, 'verifyWelcome', interaction.options.getString('welcomemessage'));

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71).setTitle('✅ Vérification')
      .setDescription('Clique sur le bouton pour te vérifier et accéder au serveur.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_me').setLabel('✅ Se vérifier').setStyle(ButtonStyle.Success)
    );
    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Panneau de vérification envoyé dans ${channel}`, ephemeral: true });
  },
};
