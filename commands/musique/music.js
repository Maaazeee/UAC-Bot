const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Contrôles de la musique')
    .addSubcommand(sub =>
      sub.setName('skip').setDescription('Passer à la musique suivante'),
    )
    .addSubcommand(sub =>
      sub.setName('stop').setDescription('Arrêter la musique et quitter le vocal'),
    )
    .addSubcommand(sub =>
      sub.setName('pause').setDescription('Mettre en pause'),
    )
    .addSubcommand(sub =>
      sub.setName('resume').setDescription('Reprendre la lecture'),
    )
    .addSubcommand(sub =>
      sub.setName('queue').setDescription('Voir la file d\'attente'),
    )
    .addSubcommand(sub =>
      sub.setName('nowplaying').setDescription('Voir la musique en cours'),
    )
    .addSubcommand(sub =>
      sub.setName('volume')
        .setDescription('Régler le volume (0-100)')
        .addIntegerOption(opt =>
          opt.setName('niveau').setDescription('Volume (0-100)').setRequired(true).setMinValue(0).setMaxValue(100),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('loop')
        .setDescription('Changer le mode de répétition')
        .addStringOption(opt =>
          opt.setName('mode').setDescription('Mode de répétition').setRequired(true)
            .addChoices(
              { name: '❌ Désactivé', value: 'off' },
              { name: '🔂 Une musique', value: 'song' },
              { name: '🔁 Toute la file', value: 'queue' },
            ),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('shuffle').setDescription('Mélanger la file d\'attente'),
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Retirer une musique de la file')
        .addIntegerOption(opt =>
          opt.setName('position').setDescription('Position dans la file').setRequired(true).setMinValue(1),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('lyrics').setDescription('Afficher les paroles de la musique en cours'),
    ),
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    const sub = interaction.options.getSubcommand();
    const voice = interaction.member.voice.channel;

    const subCommands = ['skip', 'stop', 'pause', 'resume', 'volume'];

    const noQueue = () => interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });
    const noVoice = () => interaction.reply({ content: '❌ Tu dois être dans un salon vocal.', ephemeral: true });

    if (subCommands.includes(sub) || sub === 'loop' || sub === 'shuffle' || sub === 'remove') {
      if (!voice) return noVoice();
      if (!queue) return noQueue();
      const sameChannel = interaction.guild.members.me.voice.channelId === voice.id;
      if (!sameChannel) return interaction.reply({ content: '❌ Tu n\'es pas dans le même salon vocal.', ephemeral: true });
    }

    switch (sub) {
      case 'skip': {
        if (queue.songs.length <= 1) {
          interaction.client.distube.stop(interaction.guildId);
          return interaction.reply({ content: '⏹️ Dernière musique, arrêt du lecteur.' });
        }
        await interaction.client.distube.skip(interaction.guildId);
        return interaction.reply({ content: '⏭️ Musique passée.' });
      }

      case 'stop': {
        await interaction.client.distube.stop(interaction.guildId);
        return interaction.reply({ content: '⏹️ Musique arrêtée et file vidée.' });
      }

      case 'pause': {
        if (queue.paused) return interaction.reply({ content: '⏸️ Déjà en pause.', ephemeral: true });
        await queue.pause();
        return interaction.reply({ content: '⏸️ Musique mise en pause.' });
      }

      case 'resume': {
        if (!queue.paused) return interaction.reply({ content: '▶️ Déjà en cours.', ephemeral: true });
        await queue.resume();
        return interaction.reply({ content: '▶️ Musique reprise.' });
      }

      case 'queue': {
        if (!queue) return noQueue();
        const songs = queue.songs.map((s, i) => {
          if (i === 0) return `**En cours:** ${s.name} — \`${s.formattedDuration}\``;
          return `**${i}.** ${s.name} — \`${s.formattedDuration}\``;
        });
        const chunks = [];
        for (let i = 0; i < songs.length; i += 20) {
          chunks.push(songs.slice(i, i + 20).join('\n'));
        }
        const embed = new EmbedBuilder()
          .setTitle(`📋 File d'attente (${queue.songs.length - 1} suivant(s))`)
          .setDescription(chunks[0])
          .setColor(0x00AE86);
        if (chunks.length > 1) embed.setFooter({ text: `Page 1/${chunks.length}` });
        return interaction.reply({ embeds: [embed] });
      }

      case 'nowplaying': {
        if (!queue) return noQueue();
        const s = queue.songs[0];
        const progress = queue.formattedCurrentTime;
        const total = s.formattedDuration;
        const embed = new EmbedBuilder()
          .setTitle('🎵 En cours')
          .setDescription(`**${s.name}**\n\`${progress}\` / \`${total}\``)
          .setURL(s.url)
          .setFooter({ text: `Demandé par ${s.user.tag}` })
          .setColor(0x00FF00);
        try { embed.setThumbnail(typeof s.thumbnail === 'function' ? await s.thumbnail() : s.thumbnail); } catch {}
        return interaction.reply({ embeds: [embed] });
      }

      case 'volume': {
        const level = interaction.options.getInteger('niveau');
        await queue.setVolume(level);
        return interaction.reply({ content: `🔊 Volume réglé à **${level}%**.` });
      }

      case 'loop': {
        const mode = interaction.options.getString('mode');
        const modes = { off: 0, song: 1, queue: 2 };
        await queue.setRepeatMode(modes[mode]);
        const labels = { off: 'désactivé', song: 'une musique 🔂', queue: 'toute la file 🔁' };
        return interaction.reply({ content: `🔁 Mode répétition : **${labels[mode]}**.` });
      }

      case 'shuffle': {
        await queue.shuffle();
        return interaction.reply({ content: '🔀 File mélangée !' });
      }

      case 'remove': {
        const pos = interaction.options.getInteger('position');
        if (pos >= queue.songs.length) return interaction.reply({ content: '❌ Position invalide.', ephemeral: true });
        const removed = queue.songs[pos];
        await queue.remove(pos);
        return interaction.reply({ content: `🗑️ **${removed.name}** retiré de la file.` });
      }

      case 'lyrics': {
        if (!queue) return noQueue();
        const current = queue.songs[0];
        try {
          const { getLyrics } = require('distube');
          const lyrics = await getLyrics(current.name);
          if (!lyrics) return interaction.reply({ content: '📭 Aucune parole trouvée.', ephemeral: true });
          const embed = new EmbedBuilder()
            .setTitle(`📝 ${current.name}`)
            .setDescription(lyrics.slice(0, 4000))
            .setColor(0x00AE86);
          return interaction.reply({ embeds: [embed] });
        } catch {
          return interaction.reply({ content: '📭 Aucune parole trouvée.', ephemeral: true });
        }
      }
    }
  },
};
