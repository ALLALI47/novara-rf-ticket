const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder
} = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const db = require('../database');
const { generateTranscript } = require('../transcript');

function buildPanelEmbedAndMenu() {
  const embed = new EmbedBuilder()
    .setTitle(`Welcome to ${config.botName}`)
    .setDescription(
      `Please select the ticket category that best matches your request .\n` +
      `Our team will assist you as soon as possible .\n` +
      `Thank you for choosing **${config.serverName}** .`
    )
    .setColor(config.color)
    .setImage('attachment://banner.jpg')
    .setFooter({
      text: `${config.serverName} • FiveM Roleplay Support`,
      iconURL: 'https://cdn.discordapp.com/icons/1558608511200395334/bfae86bc76ca16a32c15a014770f5167.webp?size=1024'
    });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select_category')
    .setPlaceholder('Select a ticket option');

  const options = Object.values(config.categories).map(cat => {
    return new StringSelectMenuOptionBuilder()
      .setLabel(cat.label)
      .setValue(cat.key)
      .setDescription(cat.description.slice(0, 50))
      .setEmoji(cat.emoji);
  });

  selectMenu.addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const bannerPath = path.join(__dirname, '..', 'banner.jpg');
  const files = fs.existsSync(bannerPath)
    ? [new AttachmentBuilder(bannerPath, { name: 'banner.jpg' })]
    : [];

  return { embed, row, files };
}

const commands = [
  new SlashCommandBuilder()
    .setName('setup-ticket')
    .setDescription('Envoyer le panneau officiel de ticket / نشر بانل التيكت')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Le salon où envoyer le panel (par défaut open-ticket)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('setup-staff-apply')
    .setDescription('Envoyer le panneau de recrutement Staff / نشر بانل تقديم الستاف')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Le salon où envoyer le panel staff-apply')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Ajouter un utilisateur au ticket actuel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre à ajouter')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ticket-remove')
    .setDescription('Retirer un utilisateur du ticket actuel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre à retirer')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ticket-rename')
    .setDescription('Renommer le salon du ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nouveau nom pour le salon')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Fermer le ticket actuel avec raison facultative')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison de la fermeture')
        .setRequired(false)
    )
];

function isOwnership(member, guild) {
  if (!member) return false;
  if (member.id === guild.ownerId) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const ownershipRoleIds = config.ownershipRoles || [];
  return member.roles.cache.some(r => ownershipRoleIds.includes(r.id));
}

async function handleCommands(interaction) {
  const { commandName, options, guild, channel, user, member } = interaction;
  const ticket = db.getTicket(channel.id);

  // Restrict all slash commands to Ownership
  if (!isOwnership(member, guild)) {
    return interaction.reply({
      content: '❌ Cette commande est réservée exclusivement à l\'Ownership ! / هذا الأمر مخصص فقط للأونر شيب!',
      ephemeral: true
    });
  }

  if (commandName === 'setup-ticket') {
    const targetChannel = options.getChannel('channel') ||
      guild.channels.cache.get(config.openTicketChannelId) ||
      channel;

    const { embed, row, files } = buildPanelEmbedAndMenu();

    await targetChannel.send({
      embeds: [embed],
      components: [row],
      files
    });

    return interaction.reply({
      content: `✅ Le panneau de ticket a été envoyé avec succès dans ${targetChannel} !`,
      ephemeral: true
    });
  }

  if (commandName === 'setup-staff-apply') {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Vous devez être administrateur pour utiliser cette commande.',
        ephemeral: true
      });
    }

    const { buildStaffApplyEmbedAndButton } = require('../handlers/staffApply');
    const targetChannel = options.getChannel('channel') ||
      guild.channels.cache.get(config.staffApplyChannelId) ||
      channel;

    const { embed, row } = buildStaffApplyEmbedAndButton();

    await targetChannel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: `✅ Le panneau de recrutement Staff a été envoyé dans ${targetChannel} !`,
      ephemeral: true
    });
  }

  // Check if inside a ticket channel for remaining ticket commands
  if (['ticket-add', 'ticket-remove', 'ticket-rename', 'ticket-close'].includes(commandName)) {
    if (!ticket) {
      return interaction.reply({
        content: '❌ Cette commande ne peut être utilisée qu\'à l\'intérieur d\'un salon de ticket.',
        ephemeral: true
      });
    }
  }

  if (commandName === 'ticket-add') {
    const targetUser = options.getUser('utilisateur');
    await channel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    await channel.send(`👥 <@${targetUser.id}> a été ajouté au ticket par <@${user.id}> !`);
    return interaction.reply({ content: `✅ <@${targetUser.id}> a été ajouté au ticket.`, ephemeral: true });
  }

  if (commandName === 'ticket-remove') {
    const targetUser = options.getUser('utilisateur');
    if (targetUser.id === ticket.userId) {
      return interaction.reply({
        content: '❌ Vous ne pouvez pas retirer le créateur du ticket !',
        ephemeral: true
      });
    }

    await channel.permissionOverwrites.delete(targetUser.id);
    await channel.send(`👋 <@${targetUser.id}> a été retiré du ticket par <@${user.id}>.`);
    return interaction.reply({ content: `✅ <@${targetUser.id}> a été retiré.`, ephemeral: true });
  }

  if (commandName === 'ticket-rename') {
    const newName = options.getString('nom').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30);
    await channel.setName(`🎫・${newName}`);
    return interaction.reply({ content: `✅ Salon renommé en \`🎫・${newName}\`.` });
  }

  if (commandName === 'ticket-close') {
    const reason = options.getString('raison') || 'Fermé via commande';
    await interaction.reply({ content: '🔒 Fermeture en cours... Génération du transcript...' });

    const transcriptData = await generateTranscript(channel, ticket, user);
    const attachment = new AttachmentBuilder(transcriptData.filePath, { name: transcriptData.fileName });

    db.closeTicket(channel.id, user.id, reason);

    const category = config.categories[ticket.categoryKey];
    let logChannel = null;
    if (category && category.logChannelId) {
      logChannel = guild.channels.cache.get(category.logChannelId);
    }
    if (!logChannel && category) {
      logChannel = guild.channels.cache.find(c => c.name.includes(category.key.replace(/_/g, '-')));
    }

    const logEmbed = new EmbedBuilder()
      .setTitle(`📋 LOG TICKET FERMÉ • #${ticket.ticketId}`)
      .setColor(config.colorDanger)
      .addFields(
        { name: 'Catégorie', value: `\`${category ? category.label : 'Inconnue'}\``, inline: true },
        { name: 'Créateur', value: `<@${ticket.userId}>`, inline: true },
        { name: 'Fermé par', value: `<@${user.id}>`, inline: true },
        { name: 'Raison', value: `\`${reason}\``, inline: true },
        { name: 'Messages', value: `\`${transcriptData.messageCount}\``, inline: true }
      )
      .setTimestamp();

    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(() => null);
    }

    await channel.send('⚠️ **Ce ticket sera supprimé dans 5 secondes...**');
    setTimeout(() => {
      channel.delete('Ticket closed').catch(() => null);
    }, 5000);
  }
}

module.exports = {
  commands,
  handleCommands,
  buildPanelEmbedAndMenu
};
