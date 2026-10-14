const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'tickets.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = {
  counter: 0,
  tickets: {}
};

if (fs.existsSync(dbFile)) {
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    db = JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tickets.json, resetting db:', e);
  }
}

function save() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving tickets.json:', e);
  }
}

module.exports = {
  getNextTicketId() {
    db.counter = (db.counter || 0) + 1;
    save();
    return String(db.counter).padStart(4, '0');
  },

  createTicket(channelId, data) {
    db.tickets[channelId] = {
      ...data,
      channelId,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    save();
    return db.tickets[channelId];
  },

  getTicket(channelId) {
    return db.tickets[channelId] || null;
  },

  updateTicket(channelId, partial) {
    if (!db.tickets[channelId]) return null;
    db.tickets[channelId] = { ...db.tickets[channelId], ...partial };
    save();
    return db.tickets[channelId];
  },

  closeTicket(channelId, closedBy, reason = 'No reason provided') {
    if (!db.tickets[channelId]) return null;
    db.tickets[channelId].status = 'closed';
    db.tickets[channelId].closedBy = closedBy;
    db.tickets[channelId].closedAt = new Date().toISOString();
    db.tickets[channelId].closeReason = reason;
    save();
    return db.tickets[channelId];
  },

  getUserOpenTickets(userId) {
    return Object.values(db.tickets).filter(
      t => t.userId === userId && t.status === 'open'
    );
  }
};
