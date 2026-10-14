module.exports = {
  botName: "ɴᴏᴠᴀʀᴀ ʀғ ᴛɪᴄᴋᴇᴛ",
  serverName: "ɴᴏᴠᴀʀᴀ ʀғ",
  color: "#00d4ff",
  colorDark: "#181a1f",
  colorSuccess: "#2ecc71",
  colorDanger: "#e74c3c",
  colorWarning: "#f39c12",

  guildId: process.env.GUILD_ID || "1558608511200395334",
  clientId: process.env.CLIENT_ID || "1559847565732618250",

  // Channels
  openTicketChannelId: "1558608512051978344", // 🎟️┃open・ticket
  ticketsLogCategoryId: "1558608512827916393", // ⊰───────⋅ Tickets Log ⋅───────⊱

  // Staff Apply Config
  staffApplyChannelId: "1558608512051978345", // 👷┃staff・apply
  staffApplyLogChannelId: "1558608512370868334", // 🗒️・staff・apply・log
  staffRecruitmentCategoryId: "1558608512051978349", // 🎟️𝐑𝐄𝐂 𝐒𝐓𝐀𝐅𝐅 𝐓𝐈𝐂𝐊𝐄𝐓
  waitingToTestRoleId: "1558608511200395336", // Waiting To Test
  staffManagerRoles: [
    "1558608511246536723", // Staff Manager
    "1558608511246536716", // High Staff
    "1558608511309582420", // Server Manager
    "1558608511246536717"  // Manager
  ],

  // Ownership Config (Server Owner & Ownership Roles)
  ownershipRoles: [
    "1558608511309582422", // Owner
    "1558608511309582421", // Founder
    "1558608511309582423", // 𓆩♛𓆪
    "1558608511309582420", // Server Manager
    "1558608511309582418", // General Manager
    "1558608511309582417"  // Super Manager
  ],

  // Default staff roles to notify / give access if not specified
  defaultStaffRoles: [
    "1558608511200395339", // Ticket Team
    "1558608511238275139", // Staff Team
    "1558608511246536716", // High Staff
    "1558608511238275136"  // Ticket Manager
  ],

  // 12 Ticket Categories exactly matching server & images
  categories: {
    partner: {
      key: "partner",
      label: "Partner",
      emoji: "💠",
      description: "Demande de partenariat",
      categoryId: "1558608512370868335", // 🎟️ 𝐏𝐀𝐑𝐓𝐍𝐄𝐑
      categoryName: "🎟️ 𝐏𝐀𝐑𝐓𝐍𝐄𝐑",
      logChannelId: "1558608512827916394", // 📋〡partner
      logChannelName: "📋〡partner",
      supportRoles: ["1558608511200395339", "1558608511238275139"]
    },
    vip: {
      key: "vip",
      label: "VIP",
      emoji: "👑",
      description: "Support & Avantages VIP",
      categoryId: "1558608512370868336", // 🎟️ 𝐕𝐈𝐏
      categoryName: "🎟️ 𝐕𝐈𝐏",
      logChannelId: "1558608512827916395", // 📋〡vip
      logChannelName: "📋〡vip",
      supportRoles: ["1558608511238275138", "1558608511200395339"] // Vip Responsable, Ticket Team
    },
    need_help: {
      key: "need_help",
      label: "Need Help",
      emoji: "🚨",
      description: "Assistance et aide générale",
      categoryId: "1558608512370868337", // 🎟️ 𝐍𝐄𝐄𝐃 𝐇𝐄𝐋𝐏
      categoryName: "🎟️ 𝐍𝐄𝐄𝐃 𝐇𝐄𝐋𝐏",
      logChannelId: "1558608512827916396", // 📋〡need-help
      logChannelName: "📋〡need-help",
      supportRoles: ["1558608511238275141", "1558608511238275140", "1558608511200395339"] // Helper, Assistant, Ticket Team
    },
    need_high_staff: {
      key: "need_high_staff",
      label: "Need High Staff",
      emoji: "👑",
      description: "Demande urgente pour le haut staff",
      categoryId: "1558608512370868339", // 🎟️ 𝐍𝐄𝐄𝐃 𝐇𝐈𝐆𝐇 𝐒𝐓𝐀𝐅𝐅
      categoryName: "🎟️ 𝐍𝐄𝐄𝐃 𝐇𝐈𝐆𝐇 𝐒𝐓𝐀𝐅𝐅",
      logChannelId: "1558608512827916397", // 📋〡need-high-staff
      logChannelName: "📋〡need-high-staff",
      supportRoles: ["1558608511246536716", "1558608511246536717", "1558608511309582420"] // High Staff, Manager, Server Manager
    },
    need_refund: {
      key: "need_refund",
      label: "Need Refund",
      emoji: "💵",
      description: "Demande de remboursement",
      categoryId: null, // Auto-found or auto-created
      categoryName: "🎟️ 𝐍𝐄𝐄𝐃 𝐑𝐄𝐅𝐔𝐍𝐃",
      logChannelId: "1558608512827916398", // 📋〡need-refund
      logChannelName: "📋〡need-refund",
      supportRoles: ["1558608511200395338", "1558608511238275135", "1558608511200395339"] // Refunder, Refund Manager
    },
    need_developper: {
      key: "need_developper",
      label: "Need Développer",
      emoji: "👨‍💻",
      description: "Demande technique / développeur",
      categoryId: "1558608512370868341", // 🎟️ 𝐍𝐄𝐄𝐃 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐏𝐄𝐑
      categoryName: "🎟️ 𝐍𝐄𝐄𝐃 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐏𝐄𝐑",
      logChannelId: "1558608513121521694", // 📋〡need-developper
      logChannelName: "📋〡need-developper",
      supportRoles: ["1558608511246536719", "1558608511246536718", "1558608511246536720"] // Dev team, Developer, Discord Dev
    },
    report_player: {
      key: "report_player",
      label: "Report Player",
      emoji: "🛠️",
      description: "Signaler un joueur",
      categoryId: "1558608512370868342", // 🎟️ 𝐑𝐄𝐏𝐎𝐑𝐓 𝐏𝐋𝐀𝐘𝐄𝐑
      categoryName: "🎟️ 𝐑𝐄𝐏𝐎𝐑𝐓 𝐏𝐋𝐀𝐘𝐄𝐑",
      logChannelId: "1558608513121521695", // 📋〡report-player
      logChannelName: "📋〡report-player",
      supportRoles: ["1558608511246536714", "1558608511200395339"] // Moderator, Ticket Team
    },
    report_bug: {
      key: "report_bug",
      label: "Report Bug",
      emoji: "🛠️",
      description: "Signaler un bug en jeu",
      categoryId: "1558608512370868340", // 🎟️ 𝐑𝐄𝐏𝐎𝐑𝐓 𝐁𝐔𝐆
      categoryName: "🎟️ 𝐑𝐄𝐏𝐎𝐑𝐓 𝐁𝐔𝐆",
      logChannelId: "1558608513121521696", // 📋〡report-bug
      logChannelName: "📋〡report-bug",
      supportRoles: ["1558608511246536719", "1558608511200395339"] // Dev team, Ticket Team
    },
    streamer_request: {
      key: "streamer_request",
      label: "Streamer Request",
      emoji: "👾",
      description: "Demande de grade / rôle streamer",
      categoryId: "1558608512370868343", // 🎟️ 𝐒𝐓𝐑𝐄𝐀𝐌𝐄𝐑 𝐑𝐄𝐐𝐔𝐄𝐒𝐓
      categoryName: "🎟️ 𝐒𝐓𝐑𝐄𝐀𝐌𝐄𝐑 𝐑𝐄𝐐𝐔𝐄𝐒𝐓",
      logChannelId: "1558608513121521697", // 📋〡streamer-request
      logChannelName: "📋〡streamer-request",
      supportRoles: ["1558608511238275134", "1558608511200395339"] // Streamer Manager, Ticket Team
    },
    propose_scene_event: {
      key: "propose_scene_event",
      label: "Propose Scène & Event",
      emoji: "🎬",
      description: "Proposer un événement ou une scène RP",
      categoryId: "1558608512827916389", // 🎟️ 𝐏𝐑𝐎𝐏𝐎𝐒𝐄 𝐒𝐂𝐄𝐍𝐄 & 𝐄𝐕𝐄𝐍𝐓
      categoryName: "🎟️ 𝐏𝐑𝐎𝐏𝐎𝐒𝐄 𝐒𝐂𝐄𝐍𝐄 & 𝐄𝐕𝐄𝐍𝐓",
      logChannelId: "1558608513121521698", // 📋〡propose-scene-event
      logChannelName: "📋〡propose-scene-event",
      supportRoles: ["1558608511200395343", "1558608511200395339"] // Event Manager, Ticket Team
    },
    change_name_lost_character: {
      key: "change_name_lost_character",
      label: "Change Name & Lost Character",
      emoji: "📝",
      description: "Changer de nom ou personnage perdu",
      categoryId: "1558608512827916390", // 🎟️𝐂𝐇𝐀𝐍𝐆𝐄 𝐍𝐀𝐌𝐄 & 𝐋𝐎𝐒𝐓 𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑
      categoryName: "🎟️𝐂𝐇𝐀𝐍𝐆𝐄 𝐍𝐀𝐌𝐄 & 𝐋𝐎𝐒𝐓 𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑",
      logChannelId: "1558608513121521699", // 📋〡change-name-lost-character
      logChannelName: "📋〡change-name-lost-character",
      supportRoles: ["1558608511246536716", "1558608511200395339"] // High Staff, Ticket Team
    },
    remove_ban_warn: {
      key: "remove_ban_warn",
      label: "Remove Ban & Warn",
      emoji: "🔓",
      description: "Demande de déban ou retrait avertissement",
      categoryId: "1558608512827916392", // 🎟️𝐑𝐄𝐌𝐎𝐕𝐄 𝐁𝐀𝐍 & 𝐖𝐀𝐑𝐍
      categoryName: "🎟️𝐑𝐄𝐌𝐎𝐕𝐄 𝐁𝐀𝐍 & 𝐖𝐀𝐑𝐍",
      logChannelId: "1558608513121521700", // 📋〡remove-ban-warn
      logChannelName: "📋〡remove-ban-warn",
      supportRoles: ["1558608511238275133", "1558608511246536716"] // Jugement Manager, High Staff
    }
  }
};
