# Cursor Chat History Backup

## Backup Created
Date: $(date)

## What Was Backed Up
- Chat Sessions: `chatSessions/`
- Chat Editing Sessions: `chatEditingSessions/`

## To Restore After Cursor 2.0 Upgrade:

1. **After upgrading to Cursor 2.0**, find your new workspace ID:
   - Open the project in Cursor 2.0
   - Check: `~/Library/Application Support/Cursor/User/workspaceStorage/`
   - Find the directory that contains `workspace.json` with "funnel-app" path

2. **Copy the backup files**:
   ```bash
   # Replace WORKSPACE_ID with the new workspace ID found above
   cp -r .cursor-backup/chatSessions ~/Library/Application\ Support/Cursor/User/workspaceStorage/WORKSPACE_ID/
   cp -r .cursor-backup/chatEditingSessions ~/Library/Application\ Support/Cursor/User/workspaceStorage/WORKSPACE_ID/
   ```

3. **Restart Cursor 2.0** to load the chat history

## Alternative: Manual Restore
You can also manually copy files from `.cursor-backup/` to the appropriate workspace directory.

## Note
- Chat history format may change between versions
- If restoration doesn't work, the files are still backed up here for reference




