---
description: Start Esther locally for development
---

# Starting Esther Locally

This workflow starts both the backend and frontend servers for local development with file system access.

## Steps

### 1. Open Two Terminal Windows

You'll need two separate terminal windows/tabs.

### 2. Start the Backend Server (Terminal 1)

```powershell
cd c:\Users\FrancisSilva\Desktop\Esther\server
npm install
npm run dev
```

Wait for the message: "Server running at http://localhost:3001"

### 3. Start the Frontend (Terminal 2)

```powershell
cd c:\Users\FrancisSilva\Desktop\Esther\client
npm install  
npm run dev
```

Wait for the message showing the local URL (usually http://localhost:5173)

### 4. Open the Application

Navigate to `http://localhost:5173` in your browser.

### 5. Verify File Saving

1. Click on "RAD Project"
2. Select a use case
3. Edit the spec
4. Click "Save"
5. Check `c:\Users\FrancisSilva\Desktop\RAD\specs\` to see the saved .md file

## Troubleshooting

**If you get PowerShell execution errors:**
- Use Command Prompt instead, or
- Run in PowerShell: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**If ports are already in use:**
- Kill the existing Node processes
- Or change the PORT in `server/.env.local`

## When You're Done

Press `Ctrl+C` in both terminal windows to stop the servers.
