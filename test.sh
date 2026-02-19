#!/bin/bash
# Script to test the bot locally

echo "🧪 Testing Rematch Tournament Bot..."
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"
echo ""

# Check npm
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✓ npm version: $(npm -v)"
echo ""

# Check .env file
echo "✓ Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found. Create it with:"
    echo "   DISCORD_TOKEN=your_token"
    echo "   CLIENT_ID=your_client_id"
    echo "   GUILD_ID=your_guild_id"
    exit 1
fi
echo "✓ .env file found"
echo ""

# Check node_modules
echo "✓ Checking dependencies..."
if [ ! -d node_modules ]; then
    echo "❌ Dependencies not installed. Run: npm install"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

# Check main files
echo "✓ Checking project files..."
files=("src/index.js" "deploy-commands.js" "src/commands/createteam.js")
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        exit 1
    fi
done
echo "✓ All project files present"
echo ""

echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Make sure .env has valid credentials"
echo "2. Run: npm run deploy    (register commands)"
echo "3. Run: npm start         (start bot)"
