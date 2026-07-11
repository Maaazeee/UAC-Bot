const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Jouer une musique (titre, lien YouTube/Spotify/SoundCloud)')
    .addStringOption(opt =>
      opt.setName('recherche')
        .setDescription('Titre, URL YouTube, Spotify ou SoundCloud')
        .setRequired(true),
    ),
  async execute(interaction) {
    const query = interaction.options.getString('recherche');
    const voice = interaction.member.voice.channel;
    if (!voice) return interaction.reply({ content: '❌ Tu dois être dans un salon vocal.', ephemeral: true });

    await interaction.deferReply();
    try {
      await interaction.client.distube.play(voice, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      await interaction.editReply({ content: `🔍 Recherche de **${query}**...` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Erreur: ${err.message.slice(0, 200)}` });
    }
  },
};
