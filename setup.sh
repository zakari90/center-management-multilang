#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════════
#  Center Management — One-Click VPS Setup
# ════════════════════════════════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Center Management — VPS Setup              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Check if Docker is installed ───────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed!"
    echo "⚠️  Please log out and log back in, then run this script again."
    exit 0
fi

echo "✅ Docker is installed."

# ─── Step 2: Configure the server IP ────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "🌐 Detected server IP: $SERVER_IP"
echo ""

# Update .env.production with the real IP
if [ -f .env.production ]; then
    sed -i "s|YOUR_VPS_IP|$SERVER_IP|g" .env.production
    echo "✅ Configuration updated with IP: $SERVER_IP"
else
    echo "❌ Error: .env.production file not found!"
    exit 1
fi

# ─── Step 3: Build and start the application ────────────────────────────────
echo ""
echo "🚀 Building and starting the application..."
echo "   (This may take a few minutes the first time)"
echo ""

docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Setup Complete!                          ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "   🌐 Open in browser: http://$SERVER_IP:3000"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Useful commands:"
echo "  • Stop:    docker compose -f docker-compose.prod.yml down"
echo "  • Restart: docker compose -f docker-compose.prod.yml restart"
echo "  • Logs:    docker compose -f docker-compose.prod.yml logs -f"
echo ""
