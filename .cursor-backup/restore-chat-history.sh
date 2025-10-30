#!/bin/bash

# Cursor Chat History Restore Script
# Run this after upgrading to Cursor 2.0

echo "🔍 Searching for Cursor 2.0 workspace for funnel-app..."

WORKSPACE_DIR=""
BASE_DIR="$HOME/Library/Application Support/Cursor/User/workspaceStorage"

# Find the workspace directory that contains funnel-app
for dir in "$BASE_DIR"/*/; do
    if [ -f "$dir/workspace.json" ]; then
        if grep -q "funnel-app" "$dir/workspace.json" 2>/dev/null; then
            WORKSPACE_DIR="$dir"
            break
        fi
    fi
done

if [ -z "$WORKSPACE_DIR" ]; then
    echo "❌ Could not find workspace directory for funnel-app"
    echo "   Please find it manually in: $BASE_DIR"
    echo "   Look for a directory containing workspace.json with 'funnel-app'"
    exit 1
fi

echo "✅ Found workspace: $WORKSPACE_DIR"

# Get the backup directory (assumes script is in .cursor-backup/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR"

echo "📦 Restoring chat history from: $BACKUP_DIR"

# Copy chat sessions
if [ -d "$BACKUP_DIR/chatSessions" ]; then
    cp -r "$BACKUP_DIR/chatSessions" "$WORKSPACE_DIR/"
    echo "✅ Restored chatSessions"
else
    echo "⚠️  chatSessions backup not found"
fi

# Copy chat editing sessions
if [ -d "$BACKUP_DIR/chatEditingSessions" ]; then
    cp -r "$BACKUP_DIR/chatEditingSessions" "$WORKSPACE_DIR/"
    echo "✅ Restored chatEditingSessions"
else
    echo "⚠️  chatEditingSessions backup not found"
fi

echo ""
echo "✨ Restore complete!"
echo "   Please restart Cursor 2.0 to see your chat history"




