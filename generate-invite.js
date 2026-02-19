#!/usr/bin/env node

/**
 * Discord Bot Invite Link Generator
 * 
 * This script helps you generate the correct invite link for your bot
 * after you've set up the CLIENT_ID in your .env file
 */

require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;

if (!CLIENT_ID) {
  console.error('❌ Error: CLIENT_ID not found in .env file');
  console.error('Please add: CLIENT_ID=your_client_id_here');
  process.exit(1);
}

const PERMISSIONS = {
  VIEW_CHANNELS: 1024,           // 0x400
  SEND_MESSAGES: 2048,          // 0x800
  EMBED_LINKS: 16384,           // 0x4000
  ATTACH_FILES: 32768,          // 0x8000
  READ_MESSAGE_HISTORY: 65536,  // 0x10000
  MENTION_EVERYONE: 131072,     // 0x20000
  USE_EXTERNAL_EMOJIS: 262144,  // 0x40000
  MANAGE_ROLES: 268435456,       // 0x10000000
  MANAGE_CHANNELS: 16777216,     // 0x1000000
  ADMINISTRATOR: 8,              // 0x8
};

// Calculate permission bitfield (Administrator covers everything)
const permissionBits = PERMISSIONS.ADMINISTRATOR;

const baseUrl = 'https://discord.com/api/oauth2/authorize';
const params = new URLSearchParams({
  client_id: CLIENT_ID,
  permissions: permissionBits,
  scope: ['bot', 'applications.commands'].join(' '),
});

const inviteUrl = `${baseUrl}?${params.toString()}`;

console.log('');
console.log('🤖 Discord Bot Invite Link');
console.log('═'.repeat(60));
console.log('');
console.log('Copy this link and paste it in your browser to invite the bot:');
console.log('');
console.log('🔗 ' + inviteUrl);
console.log('');
console.log('═'.repeat(60));
console.log('');
console.log('Permissions included:');
console.log('  ✓ Administrator (covers all permissions)');
console.log('  ✓ Manage Roles (for auto-ranking)');
console.log('  ✓ Manage Channels (for match channels)');
console.log('  ✓ Send Messages');
console.log('  ✓ Embed Links');
console.log('');
console.log('After inviting:');
console.log('  1. Run: npm run deploy');
console.log('  2. Run: npm start');
console.log('  3. Use: /createteam');
console.log('');
