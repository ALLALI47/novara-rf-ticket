require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType
} = require('discord.js');

const config = require('./config');
const { handleTicketCreate } = require('./handlers/ticketCreate');
const { handleTicketButton, handleTicketModal } = require('./handlers/ticketActions');
const { handleStaffApplyButton, handleStaffApplyModalSubmit, handleStaffDecision } = require('./handlers/staffApply');
const { commands, handleCommands } = require('./commands/ticketCommands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Register Slash Commands
async function registerSlashCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandData = commands.map(cmd => cmd.toJSON());

    console.log(`[INIT] Registering ${commandData.length} application commands for guild ${config.guildId}...`);
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandData }
    );
    console.log('[INIT] Application commands successfully registered!');
  } catch (error) {
    console.error('[ERROR] Failed to register application commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log(`===============================================`);
  console.log(`🤖 Bot Connecté: ${client.user.tag} (${client.user.id})`);
  console.log(`🌐 Serveur Cible: ${config.serverName} (${config.guildId})`);
  console.log(`===============================================`);

  client.user.setPresence({
    activities: [{ name: 'ɴᴏᴠᴀʀᴀ ʀғ ᴛɪᴄᴋᴇᴛ', type: ActivityType.Watching }],
    status: 'online'
  });

  await registerSlashCommands();
});

// Interaction Router
client.on('interactionCreate', async interaction => {
  try {
    // 1. Dropdown Select Menu
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_select_category') {
        return await handleTicketCreate(interaction);
      }
    }

    // 2. Buttons
    if (interaction.isButton()) {
      if (interaction.customId === 'staff_apply_btn') {
        return await handleStaffApplyButton(interaction);
      }
      if (interaction.customId.startsWith('staff_app_')) {
        return await handleStaffDecision(interaction);
      }
      if (interaction.customId.startsWith('ticket_')) {
        return await handleTicketButton(interaction);
      }
    }

    // 3. Modals
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'staff_apply_modal') {
        return await handleStaffApplyModalSubmit(interaction);
      }
      if (interaction.customId.startsWith('ticket_modal_')) {
        return await handleTicketModal(interaction);
      }
    }

    // 4. Slash Commands
    if (interaction.isChatInputCommand()) {
      return await handleCommands(interaction);
    }
  } catch (error) {
    console.error('[ERROR] Unhandled error in interactionCreate:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: `❌ Une erreur inattendue est survenue : ${error.message}`,
        ephemeral: true
      }).catch(() => null);
    } else {
      await interaction.reply({
        content: `❌ Une erreur inattendue est survenue : ${error.message}`,
        ephemeral: true
      }).catch(() => null);
    }
  }
});

// Error handling to prevent crashes
process.on('unhandledRejection', error => {
  console.error('[UNHANDLED REJECTION]', error);
});

process.on('uncaughtException', error => {
  console.error('[UNCAUGHT EXCEPTION]', error);
});

// Login
client.login(process.env.DISCORD_TOKEN);
