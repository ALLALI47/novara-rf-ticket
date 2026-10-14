require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { buildStaffApplyEmbedAndButton } = require('./handlers/staffApply');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('clientReady', async () => {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.error(`Guild ${config.guildId} introuvable !`);
      process.exit(1);
    }

    const channel = guild.channels.cache.get(config.staffApplyChannelId);
    if (!channel) {
      console.error(`Salon staff-apply ${config.staffApplyChannelId} introuvable !`);
      process.exit(1);
    }

    console.log(`Envoi du panel Staff Apply dans le salon "${channel.name}" (${channel.id})...`);
    const { embed, row } = buildStaffApplyEmbedAndButton();

    const msg = await channel.send({
      embeds: [embed],
      components: [row]
    });

    console.log(`✅ Panneau Staff Apply envoyé avec succès ! Message ID: ${msg.id}`);
  } catch (err) {
    console.error('Erreur lors de l\'envoi du panneau Staff Apply:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
