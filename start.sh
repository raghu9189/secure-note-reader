#!/bin/bash

# 🔐 Secure Notes - Quick Start Script

echo "🚀 Starting Secure Notes App..."
echo ""
echo "📦 Zero dependencies required!"
echo "🔒 Zero-knowledge encryption"
echo "🎨 Dark mode enabled"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""
echo "🌐 Starting server on http://localhost:3003"
echo ""
echo "Press Ctrl+C to stop the server"
echo "-------------------------------------------"
echo ""

# Start the server
node server.js
