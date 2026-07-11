const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Gérer les mots interdits et filtres automatiques')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Ajouter un mot interdit')
        .addStringOption(opt =>
          opt.setName('mot').setDescription('Le mot à interdire').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Supprimer un mot interdit')
        .addStringOption(opt =>
          opt.setName('mot').setDescription('Le mot à supprimer').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('liste').setDescription('Voir la liste des mots interdits'),
    )
    .addSubcommand(sub =>
      sub.setName('caps')
        .setDescription('Activer/désactiver la détection de majuscules excessives')
        .addStringOption(opt =>
          opt.setName('état').setDescription('ON ou OFF').setRequired(true)
            .addChoices({ name: 'ON', value: 'on' }, { name: 'OFF', value: 'off' }),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('massmention')
        .setDescription('Activer/désactiver la détection de mentions en masse')
        .addStringOption(opt =>
          opt.setName('état').setDescription('ON ou OFF').setRequired(true)
            .addChoices({ name: 'ON', value: 'on' }, { name: 'OFF', value: 'off' }),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('liens')
        .setDescription('Activer/désactiver le blocage des liens')
        .addStringOption(opt =>
          opt.setName('état').setDescription('ON ou OFF').setRequired(true)
            .addChoices({ name: 'ON', value: 'on' }, { name: 'OFF', value: 'off' }),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { get, set } = require('../../data/config');
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const mot = interaction.options.getString('mot').toLowerCase();
      const mots = get(interaction.guildId, 'bannedWords') || [];
      if (mots.includes(mot)) return interaction.reply({ content: '❌ Ce mot est déjà interdit.', ephemeral: true });
      mots.push(mot);
      set(interaction.guildId, 'bannedWords', mots);
      return interaction.reply({ content: `✅ **${mot}** ajouté à la liste des mots interdits.` });
    }

    if (sub === 'remove') {
      const mot = interaction.options.getString('mot').toLowerCase();
      let mots = get(interaction.guildId, 'bannedWords') || [];
      if (!mots.includes(mot)) return interaction.reply({ content: '❌ Ce mot n\'est pas dans la liste.', ephemeral: true });
      mots = mots.filter(w => w !== mot);
      set(interaction.guildId, 'bannedWords', mots);
      return interaction.reply({ content: `✅ **${mot}** retiré de la liste.` });
    }

    if (sub === 'liste') {
      const mots = get(interaction.guildId, 'bannedWords') || [];
      if (mots.length === 0) return interaction.reply({ content: '📭 Aucun mot interdit configuré.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('🚫 Mots interdits')
        .setDescription(mots.map(m => `• **${m}**`).join('\n'))
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [embed] });
    }

    const filters = {
      caps: { key: 'antiCaps', title: '🔠 Anti-majuscules', on: 'Les messages en majuscules excessives seront supprimés.', off: 'Filtre anti-majuscules désactivé.' },
      massmention: { key: 'antiMassMention', title: '📢 Anti-mentions en masse', on: 'Les mentions en masse (>4) seront supprimées.', off: 'Filtre anti-mentions désactivé.' },
      liens: { key: 'antiLink', title: '🔗 Anti-liens', on: 'Les liens (sauf Discord) seront supprimés.', off: 'Filtre anti-liens désactivé.' },
    };

    const cfg = filters[sub];
    if (!cfg) return;

    const état = interaction.options.getString('état') === 'on';
    set(interaction.guildId, cfg.key, état);

    const embed = new EmbedBuilder()
      .setTitle(cfg.title)
      .setDescription(état ? cfg.on : cfg.off)
      .setColor(état ? 0x00FF00 : 0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
