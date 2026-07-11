const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addTag, getTag, listTags, deleteTag } = require('../../data/tags');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Gère les tags (sauvegardes de texte)')
    .addSubcommand(s => s.setName('add').setDescription('Créer un tag').addStringOption(o => o.setName('nom').setDescription('Nom du tag').setRequired(true)).addStringOption(o => o.setName('contenu').setDescription('Contenu du tag').setRequired(true)))
    .addSubcommand(s => s.setName('get').setDescription('Affiche un tag').addStringOption(o => o.setName('nom').setDescription('Nom du tag').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('Liste tous les tags'))
    .addSubcommand(s => s.setName('delete').setDescription('Supprime un tag').addStringOption(o => o.setName('nom').setDescription('Nom du tag').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      addTag(interaction.guildId, interaction.options.getString('nom'), interaction.options.getString('contenu'), interaction.user.id);
      return interaction.reply({ content: '✅ Tag créé.', ephemeral: true });
    }
    if (sub === 'get') {
      const tag = getTag(interaction.guildId, interaction.options.getString('nom'));
      if (!tag) return interaction.reply({ content: '❌ Tag introuvable.', ephemeral: true });
      return interaction.reply({ content: tag.content });
    }
    if (sub === 'list') {
      const tags = listTags(interaction.guildId);
      if (!tags.length) return interaction.reply({ content: '📭 Aucun tag.', ephemeral: true });
      const embed = new EmbedBuilder().setTitle('📋 Tags').setDescription(tags.map(t => `\`${t.name}\``).join(', ')).setColor(0x00AE86);
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'delete') {
      if (!deleteTag(interaction.guildId, interaction.options.getString('nom'))) return interaction.reply({ content: '❌ Tag introuvable.', ephemeral: true });
      return interaction.reply({ content: '✅ Tag supprimé.', ephemeral: true });
    }
  },
};
