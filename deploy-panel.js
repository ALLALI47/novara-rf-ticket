require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { buildPanelEmbedAndMenu } = require('./commands/ticketCommands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.error(`Guild ${config.guildId} introuvable !`);
      process.exit(1);
    }

    const channel = guild.channels.cache.get(config.openTicketChannelId);
    if (!channel) {
      console.error(`Salon open-ticket ${config.openTicketChannelId} introuvable !`);
      process.exit(1);
    }

    console.log(`Envoi du panel dans le salon "${channel.name}" (${channel.id})...`);
    const { embed, row, files } = buildPanelEmbedAndMenu();

    const msg = await channel.send({
      embeds: [embed],
      components: [row],
      files
    });

    console.log(`✅ Panneau envoyé avec succès ! Message ID: ${msg.id}`);
  } catch (err) {
    console.error('Erreur lors de l\'envoi du panneau:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
