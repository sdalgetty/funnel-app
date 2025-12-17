#!/bin/bash

# Script to help set up Netlify test site
# This script will guide you through the process

echo "🚀 Setting up Netlify Test Site"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Please install it:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

echo "✅ Netlify CLI found"
echo ""

# Check if logged in
echo "🔍 Checking Netlify login status..."
if netlify status &> /dev/null; then
    echo "✅ Logged in to Netlify"
    netlify status | grep -E "Name:|Email:" | head -2
else
    echo "❌ Not logged in. Please run: netlify login"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo ""
echo "Since GitHub integration works best through the dashboard, here's what to do:"
echo ""
echo "1. Go to: https://app.netlify.com/"
echo "2. Click 'Add new site' → 'Import an existing project'"
echo "3. Connect GitHub and select 'funnel-app' repository"
echo "4. Configure:"
echo "   - Site name: fnnl-app-test"
echo "   - Branch to deploy: test"
echo "   - Build command: cd analytics-vite-app && npm install && npm run build"
echo "   - Publish directory: analytics-vite-app/dist"
echo "5. Click 'Deploy site'"
echo ""
echo "After the site is created, run this script again to set environment variables:"
echo "   ./setup-netlify-test-site.sh --set-env"
echo ""

# If --set-env flag is provided, set environment variables
if [ "$1" == "--set-env" ]; then
    echo "🔐 Setting environment variables..."
    echo ""
    
    # Get site ID (user needs to provide or we can try to find it)
    echo "First, we need to link to your test site."
    echo "Run: netlify link"
    echo "Then select your 'fnnl-app-test' site"
    echo ""
    echo "Or set environment variables manually in Netlify dashboard:"
    echo "   Site settings → Environment variables"
    echo ""
    echo "Add these variables:"
    echo "   VITE_SUPABASE_URL=https://xiomuqqsrqiwhjyfxoji.supabase.co"
    echo "   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI"
fi

