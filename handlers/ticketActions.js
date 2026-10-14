const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');
const config = require('../config');
const db = require('../database');
const { generateTranscript } = require('../transcript');

function isStaff(member, category) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const staffRoleIds = [
    ...(config.defaultStaffRoles || []),
    ...(category?.supportRoles || [])
  ];

  return member.roles.cache.some(r => staffRoleIds.includes(r.id));
}

async function handleTicketButton(interaction) {
  const { customId, channel, user, member, guild } = interaction;
  const ticket = db.getTicket(channel.id);
  const category = ticket ? config.categories[ticket.categoryKey] : null;

  // 1. Close Button Clicked -> Show confirmation prompt
  if (customId === 'ticket_close') {
    const isOwner = ticket ? ticket.userId === user.id : false;
    const staff = isStaff(member, category);

    if (!isOwner && !staff) {
      return interaction.reply({
        content: '❌ Seul le créateur du ticket ou un membre du staff peut fermer ce ticket !',
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('🔒 Confirmation de fermeture / تأكيد الإغلاق')
      .setDescription(
        'Êtes-vous sûr de vouloir fermer ce ticket ?\n' +
        'هل أنت متأكد من رغبتك في إغلاق هذا التيكت؟\n\n' +
        '⚠️ *Un transcript complet sera enregistré dans les logs du serveur.*'
      )
      .setColor(config.colorDanger);

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_confirm_close')
        .setLabel('Confirmer la fermeture / تأكيد')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_cancel_close')
        .setLabel('Annuler / إلغاء')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [confirmEmbed],
      components: [confirmRow]
    });
  }

  // 2. Cancel Close
  if (customId === 'ticket_cancel_close') {
    return interaction.update({
      content: '❌ Fermeture du ticket annulée. / تم إلغاء إغلاق التيكت.',
      embeds: [],
      components: []
    });
  }

  // 3. Confirm Close
  if (customId === 'ticket_confirm_close') {
    await interaction.update({
      content: '🔒 Fermeture du ticket en cours... Génération du transcript...',
      embeds: [],
      components: []
    });

    try {
      // Generate transcript
      const transcriptData = await generateTranscript(channel, ticket, user);
      const attachment = new AttachmentBuilder(transcriptData.filePath, { name: transcriptData.fileName });

      // Close in DB
      db.closeTicket(channel.id, user.id, 'Fermé via bouton');

      // Find Log Channel
      let logChannel = null;
      if (category && category.logChannelId) {
        logChannel = guild.channels.cache.get(category.logChannelId);
      }
      if (!logChannel && category && category.logChannelName) {
        logChannel = guild.channels.cache.find(c => c.name.includes(category.key.replace(/_/g, '-')));
      }

      const logEmbed = new EmbedBuilder()
        .setTitle(`📋 LOG TICKET FERMÉ • #${ticket?.ticketId || '0000'}`)
        .setColor(config.colorDanger)
        .addFields(
          { name: '📌 Catégorie / الفئة', value: `\`${category ? category.label : 'Inconnue'}\``, inline: true },
          { name: '👤 Créateur / الفاتح', value: ticket ? `<@${ticket.userId}> (\`${ticket.userId}\`)` : 'Inconnu', inline: true },
          { name: '🔒 Fermé par / أُغلق بواسطة', value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
          { name: '📌 Pris en charge par', value: ticket?.claimedBy ? `<@${ticket.claimedBy}>` : '`Aucun / None`', inline: true },
          { name: '💬 Messages', value: `\`${transcriptData.messageCount} messages\``, inline: true },
          { name: '⏰ Date ouverture', value: ticket ? `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:f>` : 'N/A', inline: true }
        )
        .setFooter({ text: `${config.serverName} • Ticket Logs`, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      if (logChannel) {
        await logChannel.send({
          embeds: [logEmbed],
          files: [attachment]
        }).catch(err => console.error('Error sending log to channel:', err));
      }

      // Try sending transcript to ticket owner DM
      if (ticket && ticket.userId) {
        const owner = await guild.members.fetch(ticket.userId).catch(() => null);
        if (owner) {
          const dmEmbed = new EmbedBuilder()
            .setTitle(`📜 Transcript Ticket • ${config.serverName}`)
            .setDescription(
              `Bonjour <@${ticket.userId}>,\n\n` +
              `Votre ticket **#${ticket.ticketId}** (${category ? category.label : 'Support'}) sur **${config.serverName}** a été fermé par <@${user.id}>.\n` +
              `Vous trouverez ci-joint la copie intégrale de la conversation.`
            )
            .setColor(config.color)
            .setTimestamp();

          await owner.send({
            embeds: [dmEmbed],
            files: [new AttachmentBuilder(transcriptData.filePath, { name: transcriptData.fileName })]
          }).catch(() => null); // Ignore if DMs are closed
        }
      }

      // Countdown and delete channel
      await channel.send({
        content: '⚠️ **Ce ticket sera supprimé dans 5 secondes... / سيتم حذف الروم خلال 5 ثوانٍ...**'
      });

      setTimeout(async () => {
        await channel.delete('Ticket fermé').catch(err => console.error('Error deleting channel:', err));
      }, 5000);

    } catch (err) {
      console.error('Error closing ticket:', err);
      await channel.send(`❌ Erreur lors de la fermeture : ${err.message}`);
    }
    return;
  }

  // 4. Claim Ticket
  if (customId === 'ticket_claim') {
    if (!isStaff(member, category)) {
      return interaction.reply({
        content: '❌ Seul un membre du staff peut réclamer ce ticket !',
        ephemeral: true
      });
    }

    if (ticket && ticket.claimedBy) {
      if (ticket.claimedBy === user.id) {
        // Option to unclaim
        db.updateTicket(channel.id, { claimedBy: null });
        return interaction.reply({
          content: `🔓 Vous avez libéré la prise en charge de ce ticket. / لقد ألغيت استلام التيكت.`
        });
      } else {
        return interaction.reply({
          content: `⚠️ Ce ticket est déjà pris en charge par <@${ticket.claimedBy}> !`,
          ephemeral: true
        });
      }
    }

    db.updateTicket(channel.id, { claimedBy: user.id });

    const claimEmbed = new EmbedBuilder()
      .setDescription(`📌 **Ce ticket est maintenant pris en charge par <@${user.id}> !**\nتم استلام التيكت من طرف المشرف.`)
      .setColor(config.colorSuccess);

    return interaction.reply({ embeds: [claimEmbed] });
  }

  // 5. Add Member Button -> Show Modal
  if (customId === 'ticket_add_member') {
    if (!isStaff(member, category) && ticket?.userId !== user.id) {
      return interaction.reply({
        content: '❌ Vous n\'avez pas la permission d\'ajouter des membres !',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('ticket_modal_add_member')
      .setTitle('Ajouter un membre / إضافة عضو');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id_input')
      .setLabel('ID Discord ou Mention du membre')
      .setPlaceholder('Exemple: 1558608511200395334')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(userInput));
    return interaction.showModal(modal);
  }

  // 6. Transcript Button
  if (customId === 'ticket_transcript') {
    await interaction.deferReply({ ephemeral: true });
    try {
      const transcriptData = await generateTranscript(channel, ticket, user);
      const attachment = new AttachmentBuilder(transcriptData.filePath, { name: transcriptData.fileName });

      return interaction.editReply({
        content: `📜 Voici le transcript actuel du ticket (${transcriptData.messageCount} messages) :`,
        files: [attachment]
      });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Erreur lors de la génération du transcript : ${err.message}`
      });
    }
  }
}

// Modal Handler
async function handleTicketModal(interaction) {
  if (interaction.customId === 'ticket_modal_add_member') {
    const rawInput = interaction.fields.getTextInputValue('user_id_input').trim();
    const userId = rawInput.replace(/[<@!>]/g, '');

    const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: '❌ Membre introuvable ! Vérifiez l\'ID ou la mention.',
        ephemeral: true
      });
    }

    await interaction.channel.permissionOverwrites.edit(targetMember.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    await interaction.channel.send({
      content: `👥 <@${targetMember.id}> a été ajouté au ticket par <@${interaction.user.id}> !`
    });

    return interaction.reply({
      content: `✅ <@${targetMember.id}> a été ajouté avec succès au ticket.`,
      ephemeral: true
    });
  }
}

module.exports = {
  handleTicketButton,
  handleTicketModal,
  isStaff
};
