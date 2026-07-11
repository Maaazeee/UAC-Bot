const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addCmd, getCmd, listCmds, deleteCmd } = require('../../data/customCommands');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cc')
    .setDescription('Gère les commandes personnalisées')
    .addSubcommand(s => s.setName('add').setDescription('Ajouter une commande').addStringOption(o => o.setName('nom').setDescription('Nom').setRequired(true)).addStringOption(o => o.setName('réponse').setDescription('Réponse').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Supprimer une commande').addStringOption(o => o.setName('nom').setDescription('Nom').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('Liste les commandes')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    if ((sub === 'add' || sub === 'remove') && !isAdmin) {
      return interaction.reply({ content: '❌ Permission administrateur requise.', ephemeral: true });
    }
    if (sub === 'add') {
      addCmd(interaction.guildId, interaction.options.getString('nom'), interaction.options.getString('réponse'), interaction.user.id);
      return interaction.reply({ content: '✅ Commande ajoutée.', ephemeral: true });
    }
    if (sub === 'remove') {
      return interaction.reply({ content: deleteCmd(interaction.guildId, interaction.options.getString('nom')) ? '✅ Commande supprimée.' : '❌ Introuvable.', ephemeral: true });
    }
    if (sub === 'list') {
      const cmds = listCmds(interaction.guildId);
      if (!cmds.length) return interaction.reply({ content: '📭 Aucune commande.', ephemeral: true });
      return interaction.reply({ content: `📋 \`!${cmds.map(c => c.name).join('`, `!')}\``, ephemeral: true });
    }
  },
};
