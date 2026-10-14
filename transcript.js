const fs = require('fs');
const path = require('path');

const transcriptsDir = path.join(__dirname, 'transcripts');
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchAllMessages(channel, limit = 200) {
  let messages = [];
  let lastId;

  while (messages.length < limit) {
    const options = { limit: Math.min(100, limit - messages.length) };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options).catch(() => null);
    if (!batch || batch.size === 0) break;

    messages.push(...batch.values());
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  return messages.reverse(); // Chronological order
}

async function generateTranscript(channel, ticketData, closerUser) {
  const messages = await fetchAllMessages(channel);
  const ticketId = ticketData?.ticketId || '0000';
  const categoryLabel = ticketData?.categoryLabel || 'Support';
  const userTag = ticketData?.userTag || 'Unknown User';

  let messagesHtml = '';
  for (const msg of messages) {
    const authorName = escapeHtml(msg.author.tag || msg.author.username);
    const avatarUrl = msg.author.displayAvatarURL({ size: 64, dynamic: true });
    const timeStr = msg.createdAt.toLocaleString('fr-FR', { timeZone: 'UTC' });
    const isBot = msg.author.bot;
    const content = escapeHtml(msg.content).replace(/\n/g, '<br>');

    let attachmentsHtml = '';
    if (msg.attachments && msg.attachments.size > 0) {
      attachmentsHtml = '<div class="attachments">' +
        msg.attachments.map(att => {
          if (att.contentType && att.contentType.startsWith('image/')) {
            return `<a href="${att.url}" target="_blank"><img src="${att.url}" class="attachment-img" alt="Attachment" /></a>`;
          }
          return `<div class="attachment-file">📁 <a href="${att.url}" target="_blank">${escapeHtml(att.name)}</a></div>`;
        }).join('') +
        '</div>';
    }

    let embedsHtml = '';
    if (msg.embeds && msg.embeds.length > 0) {
      embedsHtml = '<div class="embeds">' +
        msg.embeds.map(e => {
          return `
            <div class="embed-box" style="border-left: 4px solid ${e.hexColor || '#00d4ff'}">
              ${e.title ? `<div class="embed-title">${escapeHtml(e.title)}</div>` : ''}
              ${e.description ? `<div class="embed-desc">${escapeHtml(e.description).replace(/\n/g, '<br>')}</div>` : ''}
            </div>
          `;
        }).join('') +
        '</div>';
    }

    messagesHtml += `
      <div class="message ${isBot ? 'bot-message' : ''}">
        <img class="avatar" src="${avatarUrl}" alt="${authorName}" />
        <div class="message-content">
          <div class="message-header">
            <span class="author-name">${authorName}</span>
            ${isBot ? '<span class="bot-tag">BOT</span>' : ''}
            <span class="timestamp">${timeStr}</span>
          </div>
          ${content ? `<div class="message-text">${content}</div>` : ''}
          ${attachmentsHtml}
          ${embedsHtml}
        </div>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ticket #${ticketId} Transcript - NOVARA RF</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f1115;
      color: #e0e4eb;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #17191f;
      border: 1px solid #232834;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #091321 0%, #152438 100%);
      border-bottom: 2px solid #00d4ff;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 22px;
      color: #ffffff;
      letter-spacing: 1px;
    }
    .header h1 span { color: #00d4ff; }
    .badge {
      background: #00d4ff22;
      color: #00d4ff;
      border: 1px solid #00d4ff55;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .info-bar {
      background: #12141a;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid #232834;
      font-size: 13px;
    }
    .info-item span.label { color: #8892b0; display: block; margin-bottom: 2px; }
    .info-item span.val { color: #ccd6f6; font-weight: 600; }
    .chat-log {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 8px 12px;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .message:hover {
      background: #1e222b;
    }
    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #2a2e39;
    }
    .message-content {
      flex: 1;
    }
    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .author-name {
      font-weight: 600;
      color: #00d4ff;
      font-size: 14px;
    }
    .bot-tag {
      background: #5865f2;
      color: white;
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 4px;
      font-weight: 700;
    }
    .timestamp {
      font-size: 11px;
      color: #6c7693;
    }
    .message-text {
      font-size: 14px;
      color: #dcddde;
      word-break: break-word;
    }
    .attachments { margin-top: 8px; }
    .attachment-img {
      max-width: 320px;
      max-height: 240px;
      border-radius: 6px;
      border: 1px solid #2a2e39;
    }
    .embed-box {
      background: #1c202a;
      border-radius: 4px;
      padding: 10px 14px;
      margin-top: 8px;
    }
    .embed-title {
      font-weight: 600;
      color: #fff;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .embed-desc {
      font-size: 13px;
      color: #b9bbbe;
    }
    .footer {
      background: #0d0f13;
      padding: 14px 24px;
      text-align: center;
      font-size: 12px;
      color: #555e75;
      border-top: 1px solid #232834;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><span>ɴᴏᴠᴀʀᴀ ʀғ</span> TICKET #${ticketId}</h1>
      <span class="badge">${escapeHtml(categoryLabel)}</span>
    </div>
    <div class="info-bar">
      <div class="info-item"><span class="label">Créateur / الفاتح:</span><span class="val">${escapeHtml(userTag)}</span></div>
      <div class="info-item"><span class="label">Fermé par / أُغلق بواسطة:</span><span class="val">${escapeHtml(closerUser?.tag || closerUser?.username || 'Système')}</span></div>
      <div class="info-item"><span class="label">Nombre de messages:</span><span class="val">${messages.length} messages</span></div>
      <div class="info-item"><span class="label">Date:</span><span class="val">${new Date().toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC</span></div>
    </div>
    <div class="chat-log">
      ${messagesHtml || '<div style="color: #888; text-align: center; padding: 20px;">Aucun message enregistré.</div>'}
    </div>
    <div class="footer">
      Système de Ticket Automatisé • ɴᴏᴠᴀʀᴀ ʀғ
    </div>
  </div>
</body>
</html>`;

  const fileName = `transcript-ticket-${ticketId}.html`;
  const filePath = path.join(transcriptsDir, fileName);
  fs.writeFileSync(filePath, html, 'utf8');

  return { filePath, fileName, messageCount: messages.length };
}

module.exports = {
  generateTranscript
};
