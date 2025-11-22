# Esther - Local Development Setup

## Running Locally (with File System Access)

When running Esther locally, specs will be saved directly to your RAD project directory at `c:\Users\FrancisSilva\Desktop\RAD\specs\`.

### Prerequisites
- Node.js installed
- PowerShell execution policy configured (or use Command Prompt)

### Setup Instructions

1. **Start the Backend Server** (Terminal 1):
```powershell
cd server
npm install
npm run dev
```
The server will start on `http://localhost:3001`

2. **Start the Frontend** (Terminal 2):
```powershell
cd client
npm install
npm run dev
```
The client will start on `http://localhost:5173`

3. **Open the Application**:
Navigate to `http://localhost:5173` in your browser

### How It Works

- **Local Mode**: When accessing via `localhost`, the app automatically connects to `http://localhost:3001`
- **Production Mode**: When accessing via `esther-workflow.vercel.app`, the app uses Vercel's serverless functions

### File Saving

When running locally:
- ✅ Specs are saved to `RAD/specs/*.md` files
- ✅ Files are immediately available for git commits
- ✅ AI agent can read them directly from the file system

When running on Vercel:
- ⚠️ Specs are stored in-memory (temporary)
- Use local mode for actual development work

### Environment Variables

The server uses `.env.local` for local development:
```
PORT=3001
GEMINI_API_KEY=AIzaSyAkPlWBn_eEPbcnN9FHHsXbpNL85sxQCxs
```

### Troubleshooting

**PowerShell Script Execution Error:**
If you get a script execution error, either:
1. Use Command Prompt instead of PowerShell
2. Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**Port Already in Use:**
If port 3001 or 5173 is in use, change the PORT in `.env.local` or kill the existing process.

**CORS Errors:**
The server is configured with CORS enabled for `localhost`. If you still see errors, check that both servers are running.

## Production Deployment

The app is automatically deployed to Vercel at:
https://esther-workflow.vercel.app

Push to the `main` branch to trigger a new deployment.
