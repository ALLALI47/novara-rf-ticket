const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../config');
const db = require('../database');

async function handleTicketCreate(interaction) {
  const categoryKey = interaction.values[0];
  const category = config.categories[categoryKey];

  if (!category) {
    return interaction.reply({
      content: '❌ Catégorie de ticket invalide !',
      ephemeral: true
    });
  }

  // Prevent multiple open tickets of the same category
  const openTickets = db.getUserOpenTickets(interaction.user.id);
  const sameCategoryTicket = openTickets.find(t => t.categoryKey === categoryKey);
  if (sameCategoryTicket) {
    const existingChannel = interaction.guild.channels.cache.get(sameCategoryTicket.channelId);
    if (existingChannel) {
      return interaction.reply({
        content: `❌ Vous avez déjà un ticket ouvert dans cette catégorie : ${existingChannel} !\nلديك بالفعل تيكت مفتوح في هذه الفئة!`,
        ephemeral: true
      });
    }
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;
    const user = interaction.user;

    // 1. Find or create category
    let targetCategory = null;
    if (category.categoryId) {
      targetCategory = guild.channels.cache.get(category.categoryId);
    }
    
    // Fallback: search category by name
    if (!targetCategory && category.categoryName) {
      targetCategory = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && 
             (c.name.toLowerCase().includes(category.label.toLowerCase()) || 
              c.name.includes(category.categoryName))
      );
    }

    // If category still not found, create it
    if (!targetCategory) {
      targetCategory = await guild.channels.create({
        name: category.categoryName || `🎟️ ${category.label.toUpperCase()}`,
        type: ChannelType.GuildCategory
      }).catch(err => {
        console.error('Error creating category:', err);
        return null;
      });
    }

    // 2. Build Permission Overwrites
    // ONLY ticket opener, bot, and staff can see the channel
    const permissionOverwrites = [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id, // Opener
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: guild.client.user.id, // Bot
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      }
    ];

    // Add support roles
    const supportRoles = Array.from(new Set([
      ...(category.supportRoles || []),
      ...(config.defaultStaffRoles || [])
    ]));

    for (const roleId of supportRoles) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        permissionOverwrites.push({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        });
      }
    }

    // 3. Create Ticket Channel
    const ticketId = db.getNextTicketId();
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    const channelName = `🎫・${categoryKey.replace(/_/g, '-')}-${cleanUsername || 'user'}`;

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: targetCategory ? targetCategory.id : null,
      topic: `Ticket #${ticketId} | Catégorie: ${category.label} | Utilisateur: ${user.tag} (${user.id})`,
      permissionOverwrites
    });

    // 4. Save to DB
    db.createTicket(ticketChannel.id, {
      ticketId,
      userId: user.id,
      userTag: user.tag,
      categoryKey,
      categoryLabel: category.label,
      categoryId: targetCategory ? targetCategory.id : null,
      channelId: ticketChannel.id
    });

    // 5. Build Ticket Welcome Embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`**${config.botName} • #${ticketId}**`)
      .setDescription(
        `> مرحباً بك <@${user.id}> في تيكت الدعم الفني الخاص بسيرفر **${config.serverName}**!\n` +
        `> Bienvenue dans votre salon de support **${config.serverName}** !\n\n` +
        `📌 **Catégorie / الفئة:** \`${category.emoji} ${category.label}\`\n` +
        `👤 **Auteur / صاحب التيكت:** <@${user.id}> (\`${user.id}\`)\n` +
        `⏰ **Ouvert le / فتح بتاريخ:** <t:${Math.floor(Date.now() / 1000)}:f>\n` +
        `⚡ **Statut / الحالة:** \`En attente du staff / في انتظار الإدارة\`\n\n` +
        `ℹ️ *Merci de détailler votre demande (ID FiveM, preuves vidéo/captures d'écran, explications).*`
      )
      .setColor(config.color)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setFooter({
        text: `${config.serverName} • Ticket System`,
        iconURL: guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Fermer / إغلاق')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim / استلام')
        .setEmoji('📌')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_add_member')
        .setLabel('Ajouter / إضافة')
        .setEmoji('👥')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Transcript / نسخ')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary)
    );

    // Mention user and relevant roles
    let mentionStaff = '';
    if (category.supportRoles && category.supportRoles.length > 0) {
      mentionStaff = category.supportRoles.map(rId => `<@&${rId}>`).join(' ');
    }

    await ticketChannel.send({
      content: `👋 Bienvenue <@${user.id}> ! ${mentionStaff}`,
      embeds: [welcomeEmbed],
      components: [actionRow]
    });

    await interaction.editReply({
      content: `✅ Votre ticket a été créé avec succès dans ${ticketChannel} !\nتم فتح التيكت الخاص بك بنجاح!`
    });

  } catch (error) {
    console.error('Error handling ticket creation:', error);
    await interaction.editReply({
      content: `❌ Une erreur est survenue lors de la création du ticket : ${error.message}`
    });
  }
}

module.exports = {
  handleTicketCreate
};
