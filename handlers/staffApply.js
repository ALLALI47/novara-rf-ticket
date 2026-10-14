const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');
const db = require('../database');

function buildStaffApplyEmbedAndButton() {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${config.botName}`,
      iconURL: 'https://cdn.discordapp.com/icons/1558608511200395334/bfae86bc76ca16a32c15a014770f5167.webp?size=1024'
    })
    .setDescription(
      `• **WELCOME TO STAFF APPLY** ✅\n\n` +
      `• **DO YOU WANT TO BE PART OF THE ${config.serverName.toUpperCase()} STAFF TEAM ?** 🛠️\n\n` +
      `• **DO YOU HAVE A LOT OF EXPERIENCE ?**\n\n` +
      `• **JUST FILL OUT THE FORM AND YOUR APPLICATION WILL BE REVIEWED . THANKS !** 🛡️`
    )
    .setColor('#00d4ff')
    .setFooter({
      text: `${config.serverName} • Staff Recruitment`,
      iconURL: 'https://cdn.discordapp.com/icons/1558608511200395334/bfae86bc76ca16a32c15a014770f5167.webp?size=1024'
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('staff_apply_btn')
      .setLabel('Apply')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row };
}

async function handleStaffApplyButton(interaction) {
  // Check if user already has an open staff application
  const openTickets = db.getUserOpenTickets(interaction.user.id);
  const existingApp = openTickets.find(t => t.categoryKey === 'staff_apply');
  if (existingApp) {
    const channel = interaction.guild.channels.cache.get(existingApp.channelId);
    if (channel) {
      return interaction.reply({
        content: `❌ Vous avez déjà une candidature en cours d'examen dans ce salon : ${channel} !\nلديك طلب تقديم قيد المراجعة بالفعل!`,
        ephemeral: true
      });
    }
  }

  // Build the 5-field modal matching screenshot exactly
  const modal = new ModalBuilder()
    .setCustomId('staff_apply_modal')
    .setTitle('Application Form');

  const nameInput = new TextInputBuilder()
    .setCustomId('apply_name')
    .setLabel('Name :')
    .setPlaceholder('Votre nom / prénom (IRL & RP)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const ageInput = new TextInputBuilder()
    .setCustomId('apply_age')
    .setLabel('Age :')
    .setPlaceholder('Votre âge (ex: 18)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const expInput = new TextInputBuilder()
    .setCustomId('apply_exp')
    .setLabel('Expérience :')
    .setPlaceholder('Vos anciennes expériences en tant que staff FiveM / Discord...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const activityInput = new TextInputBuilder()
    .setCustomId('apply_activity')
    .setLabel('Activity :')
    .setPlaceholder('Vos heures de disponibilité par jour (ex: 4-6h/jour)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const whyInput = new TextInputBuilder()
    .setCustomId('apply_why')
    .setLabel('Why should we accept you ? :')
    .setPlaceholder('Pourquoi devrions-nous vous choisir parmi les autres candidats ?')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(ageInput),
    new ActionRowBuilder().addComponents(expInput),
    new ActionRowBuilder().addComponents(activityInput),
    new ActionRowBuilder().addComponents(whyInput)
  );

  await interaction.showModal(modal);
}

async function handleStaffApplyModalSubmit(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const { guild, user } = interaction;
    const name = interaction.fields.getTextInputValue('apply_name').trim();
    const age = interaction.fields.getTextInputValue('apply_age').trim();
    const experience = interaction.fields.getTextInputValue('apply_exp').trim();
    const activity = interaction.fields.getTextInputValue('apply_activity').trim();
    const why = interaction.fields.getTextInputValue('apply_why').trim();

    // Find Recruitment Category
    let category = guild.channels.cache.get(config.staffRecruitmentCategoryId);
    if (!category) {
      category = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildCategory && c.name.includes('REC STAFF')
      );
    }

    // Permission Overwrites
    const permissionOverwrites = [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id, // Candidate
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

    // Staff Manager roles access
    const staffRoles = config.staffManagerRoles || [];
    for (const roleId of staffRoles) {
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

    const ticketId = db.getNextTicketId();
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const channelName = `📋・rec-${cleanUsername || 'candidate'}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      topic: `Candidature Staff #${ticketId} | Candidat: ${user.tag} (${user.id})`,
      permissionOverwrites
    });

    // Save ticket in DB
    db.createTicket(channel.id, {
      ticketId,
      userId: user.id,
      userTag: user.tag,
      categoryKey: 'staff_apply',
      categoryLabel: 'Staff Application',
      channelId: channel.id,
      applicationData: { name, age, experience, activity, why }
    });

    // Application Embed in candidate's ticket channel
    const appEmbed = new EmbedBuilder()
      .setTitle(`📝 NOUVELLE CANDIDATURE STAFF • #${ticketId}`)
      .setDescription(`Candidature soumise par <@${user.id}> (\`${user.id}\`)`)
      .addFields(
        { name: '👤 Nom / Name', value: `\`\`\`${name}\`\`\``, inline: true },
        { name: '🎂 Âge / Age', value: `\`\`\`${age}\`\`\``, inline: true },
        { name: '⚡ Activité / Activity', value: `\`\`\`${activity}\`\`\``, inline: true },
        { name: '💼 Expérience', value: `\`\`\`${experience}\`\`\`` },
        { name: '❓ Why should we accept you ?', value: `\`\`\`${why}\`\`\`` }
      )
      .setColor('#00d4ff')
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${config.serverName} • Recrutement Staff`, iconURL: guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_app_accept')
        .setLabel('Accepter pour Test / قبول للاختبار')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('staff_app_reject')
        .setLabel('Refuser / رفض')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Fermer / إغلاق')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary)
    );

    let staffMentions = '';
    if (config.staffManagerRoles && config.staffManagerRoles.length > 0) {
      staffMentions = config.staffManagerRoles.map(rId => `<@&${rId}>`).join(' ');
    }

    await channel.send({
      content: `👋 Bienvenue <@${user.id}> ! Votre candidature est transmise au haut staff : ${staffMentions}`,
      embeds: [appEmbed],
      components: [actionRow]
    });

    // Also send summary to staff apply log channel
    const logChannel = guild.channels.cache.get(config.staffApplyLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`📥 NOUVELLE CANDIDATURE REÇUE • #${ticketId}`)
        .setColor('#3498db')
        .setDescription(`Le membre <@${user.id}> (${user.tag}) vient de postuler pour l'équipe staff.\nSalon de test : ${channel}`)
        .addFields(
          { name: '👤 Nom', value: name, inline: true },
          { name: '🎂 Âge', value: age, inline: true },
          { name: '⚡ Activité', value: activity, inline: true }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
    }

    await interaction.editReply({
      content: `✅ Votre candidature a été envoyée avec succès ! Accédez à votre salon ici : ${channel}\nتم تقديم طلبك بنجاح وسيقوم الطاقم الإداري بمراجعته.`
    });

  } catch (err) {
    console.error('Error handling staff apply modal:', err);
    await interaction.editReply({
      content: `❌ Une erreur est survenue : ${err.message}`
    });
  }
}

// Handle Accept / Reject buttons by Staff
async function handleStaffDecision(interaction) {
  const { customId, member, channel, guild, user } = interaction;
  const ticket = db.getTicket(channel.id);

  // Check if staff has management role or admin
  const isManager = member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some(r => (config.staffManagerRoles || []).includes(r.id));

  if (!isManager) {
    return interaction.reply({
      content: '❌ Seul un responsable du recrutement (Staff Manager / High Staff) peut prendre cette décision !',
      ephemeral: true
    });
  }

  if (customId === 'staff_app_accept') {
    // Add Waiting To Test role to candidate
    if (ticket && ticket.userId) {
      const candidateMember = await guild.members.fetch(ticket.userId).catch(() => null);
      if (candidateMember && config.waitingToTestRoleId) {
        await candidateMember.roles.add(config.waitingToTestRoleId).catch(e => console.error('Error adding role:', e));
      }
    }

    const acceptEmbed = new EmbedBuilder()
      .setTitle('🎉 CANDIDATURE RETENUE POUR TEST !')
      .setDescription(
        `Félicitations <@${ticket ? ticket.userId : 'candidat'}> ! Votre profil a été validé par <@${user.id}>.\n\n` +
        `• Le rôle <@&${config.waitingToTestRoleId}> vous a été attribué.\n` +
        `• Un entretien vocal / test de règles sera programmé prochainement dans les salons vocaux staff.\n` +
        `• Tenez-vous prêt et révisez le règlement du serveur !`
      )
      .setColor('#2ecc71')
      .setTimestamp();

    // Disable decision buttons
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accepted_btn')
        .setLabel('Candidat Accepté pour Test ✅')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Fermer / إغلاق')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ embeds: [acceptEmbed] });
    await interaction.update({ components: [disabledRow] });

    // Update log channel
    const logChannel = guild.channels.cache.get(config.staffApplyLogChannelId);
    if (logChannel) {
      await logChannel.send({
        content: `✅ La candidature de <@${ticket?.userId}> a été **ACCEPTÉE pour test** par <@${user.id}>.`
      }).catch(() => null);
    }
  }

  if (customId === 'staff_app_reject') {
    const rejectEmbed = new EmbedBuilder()
      .setTitle('❌ CANDIDATURE NON RETENUE')
      .setDescription(
        `Bonjour <@${ticket ? ticket.userId : 'candidat'}>,\n\n` +
        `Après examen attentif de votre candidature par <@${user.id}>, nous avons le regret de vous informer que votre profil n'a pas été retenu pour le moment.\n\n` +
        `Nous vous remercions pour votre intérêt pour **${config.serverName}** et vous souhaitons une excellente expérience de jeu sur notre serveur.`
      )
      .setColor('#e74c3c')
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('rejected_btn')
        .setLabel('Candidature Refusée ❌')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Fermer / إغلاق')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ embeds: [rejectEmbed] });
    await interaction.update({ components: [disabledRow] });

    // Update log channel
    const logChannel = guild.channels.cache.get(config.staffApplyLogChannelId);
    if (logChannel) {
      await logChannel.send({
        content: `❌ La candidature de <@${ticket?.userId}> a été **REFUSÉE** par <@${user.id}>.`
      }).catch(() => null);
    }
  }
}

module.exports = {
  buildStaffApplyEmbedAndButton,
  handleStaffApplyButton,
  handleStaffApplyModalSubmit,
  handleStaffDecision
};
