/**
 * Bot Validation Script
 * Checks all project files and configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Validating Rematch Tournament Bot Project...\n');

let issues = [];
let warnings = [];

// Check required files
const requiredFiles = [
  'src/index.js',
  'src/events/ready.js',
  'src/events/interactionCreate.js',
  'src/utils/database.js',
  'src/utils/mmr.js',
  'deploy-commands.js',
  'config.js',
  '.env',
  'package.json',
];

console.log('📁 Checking required files...');
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file}`);
    issues.push(`Missing file: ${file}`);
  }
});

// Check commands folder
console.log('\n🎮 Checking commands...');
const commandsDir = path.join(__dirname, 'src/commands');
if (fs.existsSync(commandsDir)) {
  const commands = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
  console.log(`  ✅ Found ${commands.length} commands`);
  
  const expectedCommands = [
    'createteam.js',
    'setcaptain.js',
    'addmember.js',
    'removemember.js',
    'teaminfo.js',
    'rank.js',
    'leaderboard.js',
    'history.js',
    'queue.js',
    'win.js',
    'setmmr.js',
    'resetseason.js',
  ];
  
  expectedCommands.forEach((cmd) => {
    if (commands.includes(cmd)) {
      console.log(`    ✅ ${cmd}`);
    } else {
      console.log(`    ⚠️  Missing: ${cmd}`);
      warnings.push(`Missing command: ${cmd}`);
    }
  });
} else {
  issues.push('Commands directory not found');
}

// Check events folder
console.log('\n⚡ Checking events...');
const eventsDir = path.join(__dirname, 'src/events');
if (fs.existsSync(eventsDir)) {
  const events = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'));
  console.log(`  ✅ Found ${events.length} events`);
} else {
  issues.push('Events directory not found');
}

// Check .env file
console.log('\n🔑 Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  if (env.includes('DISCORD_TOKEN') && env.includes('CLIENT_ID') && env.includes('GUILD_ID')) {
    if (env.includes('your_')) {
      console.log('  ⚠️  .env found but contains placeholder values');
      warnings.push('Please update .env with your actual bot credentials');
    } else {
      console.log('  ✅ .env configured');
    }
  } else {
    console.log('  ❌ .env missing required variables');
    issues.push('.env missing: DISCORD_TOKEN, CLIENT_ID, or GUILD_ID');
  }
} else {
  console.log('  ⚠️  .env file not found');
  warnings.push('Create .env file with your Discord credentials');
}

// Check package.json
console.log('\n📦 Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = ['discord.js', 'dotenv'];
  requiredDeps.forEach((dep) => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`  ✅ ${dep} (${pkg.dependencies[dep]})`);
    } else {
      console.log(`  ❌ ${dep} not found`);
      warnings.push(`Missing dependency: ${dep}`);
    }
  });
  
  if (pkg.scripts && pkg.scripts.start && pkg.scripts.deploy) {
    console.log(`  ✅ Scripts configured`);
  } else {
    console.log(`  ⚠️  Missing npm scripts`);
  }
}

// Check data folder
console.log('\n💾 Checking data folder...');
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
  console.log('  ✅ data/ folder exists');
} else {
  console.log('  ℹ️  data/ folder will be created on first run');
}

// Check node_modules
console.log('\n📚 Checking node modules...');
const nmDir = path.join(__dirname, 'node_modules');
if (fs.existsSync(nmDir)) {
  console.log('  ✅ node_modules/ installed');
} else {
  console.log('  ⚠️  node_modules/ not found');
  warnings.push('Run: npm install');
}

// Summary
console.log('\n' + '═'.repeat(50));
console.log('📋 VALIDATION SUMMARY');
console.log('═'.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Bot is ready to run.\n');
  console.log('Next steps:');
  console.log('  1. npm run deploy    (register slash commands)');
  console.log('  2. npm start         (start the bot)');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ Issues found (${issues.length}):`);
    issues.forEach((issue) => console.log(`   - ${issue}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach((warning) => console.log(`   - ${warning}`));
  }

  console.log('\nFix these issues before starting the bot.');
}

console.log('═'.repeat(50));
