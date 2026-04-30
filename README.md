# LinkedIn Social MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

## What is this?

This lets **Claude AI control your LinkedIn** — posting, scheduling, replying, and pulling analytics — all by just typing a message to Claude.

Once set up, you can say things like:

> *"Schedule a post on our company LinkedIn page for tomorrow at 9am"*
> *"Show me all my scheduled posts"*
> *"Post this on our HealthyBite page: [text]"*
> *"What are the follower stats for our company page?"*

**Scheduled posts fire automatically** — even when your laptop is off — using a background scheduler and GitHub Actions cloud backup.

---

## What can you do?

| Action | Example prompt to Claude |
|---|---|
| Post as yourself | *"Post on my LinkedIn: 'Excited about AI!'"* |
| Post as your company page | *"Post on our company page: 'We're hiring!'"* |
| Schedule a post | *"Schedule a post for Monday 9am: 'Happy Monday!'"* |
| Preview before posting | *"Preview this post before I publish it"* |
| See scheduled posts | *"Show all my scheduled LinkedIn posts"* |
| Cancel a scheduled post | *"Cancel my scheduled post from yesterday"* |
| Get analytics | *"Show follower stats for our company page"* |
| Manage your page | *"List all admins on our LinkedIn company page"* |

---

## Before You Start — What You Need

You need **three things** before setup. Don't skip this section.

### 1. Node.js (free software)
This runs the server on your computer.

- Go to **https://nodejs.org**
- Download the version that says **"LTS"** (Long Term Support)
- Install it like any normal program
- To check it worked: open **Terminal** (Mac) or **Command Prompt** (Windows), type `node --version`, press Enter
- You should see something like `v20.x.x` ✅

### 2. Claude Code or Claude Desktop
This is the AI app you'll be chatting with.

- **Claude Code**: https://claude.ai/code ← recommended
- **Claude Desktop**: https://claude.ai/download

### 3. A LinkedIn Developer App (free)
This is what gives the server permission to access your LinkedIn. It's free to create.

Steps:
1. Go to **https://www.linkedin.com/developers/apps**
2. Click **"Create App"**
3. Fill in:
   - **App name**: anything (e.g. "My LinkedIn MCP")
   - **LinkedIn Page**: choose any page you manage, or create a placeholder
   - **App logo**: upload any image
4. Click **"Create App"**
5. On the next screen, click the **"Products"** tab
6. Find **"Share on LinkedIn"** and click **"Request Access"** — approve it
7. Click the **"Auth"** tab
8. Under **"OAuth 2.0 settings"**, click the pencil icon next to Redirect URLs
9. Add this URL exactly: `http://localhost:3000/callback` and save
10. Stay on the **Auth** tab — you'll need the **Client ID** and **Client Secret** shown there

---

## Setup Guide

> **Estimated time: 10–15 minutes**
> Follow each step in order. Don't skip ahead.

---

### Step 1 — Download the server

Open **Terminal** (Mac: press `Cmd+Space`, type "Terminal") or **Command Prompt** (Windows: press `Win+R`, type "cmd").

Paste this and press Enter:

```bash
git clone https://github.com/amit123amit/linkedin-social-mcp.git ~/linkedin-social-mcp
```

> **What you should see:** A folder called `linkedin-social-mcp` appears in your home directory.

If you don't have `git`, download it from **https://git-scm.com/downloads** first.

---

### Step 2 — Install and build

Paste these two commands one at a time, pressing Enter after each:

```bash
cd ~/linkedin-social-mcp
```

```bash
npm install && npm run build
```

> **What you should see:** Lots of text scrolling by, ending with something like `"dist/index.js"`. This takes 1–2 minutes.
> If you see errors, make sure Node.js 18+ is installed (Step 1 of prerequisites).

---

### Step 3 — Add your LinkedIn credentials

Create the config file:

```bash
cp ~/linkedin-social-mcp/.env.example ~/linkedin-social-mcp/.env
```

Now open the `.env` file in a text editor:

- **Mac:** `open -e ~/linkedin-social-mcp/.env`
- **Windows:** `notepad %USERPROFILE%\linkedin-social-mcp\.env`

You'll see something like:
```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

Replace `your_client_id_here` and `your_client_secret_here` with the values from your LinkedIn Developer App (Auth tab). Save the file.

---

### Step 4 — Connect to Claude

This tells Claude where to find the server.

**If you use Claude Code**, paste this in Terminal (replace `YOUR_USERNAME` with your Mac/Windows username):

```bash
# Find your username if unsure:
whoami
```

Then edit the Claude settings file. On **Mac**:

```bash
open -e ~/.claude/settings.json
```

On **Windows**:
```
notepad %USERPROFILE%\.claude\settings.json
```

Add this inside the file (replace `/Users/YOUR_USERNAME` with your actual path):

```json
{
  "mcpServers": {
    "linkedin-social": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/linkedin-social-mcp/dist/index.js"],
      "env": {
        "LINKEDIN_CLIENT_ID": "paste-your-client-id-here",
        "LINKEDIN_CLIENT_SECRET": "paste-your-client-secret-here"
      }
    }
  }
}
```

**If you use Claude Desktop**, edit this file instead:
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the same block above, then **restart Claude Desktop completely**.

---

### Step 5 — Log in to LinkedIn

Run this in Terminal:

```bash
cd ~/linkedin-social-mcp && npm run auth
```

> **What happens:** A browser window opens with LinkedIn's login page.
> Log in with your LinkedIn account and click **"Allow"** when asked for permissions.
> You'll see a success message in the browser: `"Authentication successful! You can close this tab."`

To check your login worked:

```bash
npm run auth status
```

> **You should see:** your name, token expiry date, and granted permissions. ✅

---

### Step 6 — Test it

Open Claude and type:

> *"Get my LinkedIn profile"*

> **You should see:** your LinkedIn name, headline, and profile URL. ✅

That means everything is working.

---

## Scheduler Setup — For Scheduled Posts

> **If you only want to post immediately, you can skip this section.**
> You need this if you want to say "schedule a post for next Monday."

When you schedule a post, it gets saved to a file on your computer. A background program checks this file regularly and publishes posts when their time arrives.

There are two options — **set up both for maximum reliability**.

---

### Scheduler Option A — Your Computer (Mac)

This runs a background check every 60 seconds while your laptop is on.

**Step 1 — Find your Node.js path:**
```bash
which node
```
Copy the result (e.g. `/opt/homebrew/bin/node`).

**Step 2 — Create the background task file:**

Run this in Terminal (replace `YOUR_USERNAME` with your username from `whoami`, and replace the node path if yours is different):

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.linkedin.social.mcp.scheduler</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/YOUR_USERNAME/linkedin-social-mcp/scheduler-daemon.mjs</string>
    </array>
    <key>StartInterval</key><integer>60</integer>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><false/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/.linkedin-social-mcp/launchagent-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/.linkedin-social-mcp/launchagent-stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key><string>/Users/YOUR_USERNAME</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/linkedin-social-mcp</string>
</dict>
</plist>
EOF
```

**Step 3 — Start it:**
```bash
launchctl load ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist
```

**Step 4 — Verify it's running:**
```bash
launchctl list | grep linkedin
```
> **You should see** a line with `com.linkedin.social.mcp.scheduler` ✅
> It will automatically start every time you log in to your Mac.

---

### Scheduler Option A — Your Computer (Windows)

Run this in **PowerShell as Administrator** (right-click PowerShell → "Run as administrator"):

```powershell
$action = New-ScheduledTaskAction `
  -Execute "node.exe" `
  -Argument "C:\Users\$env:USERNAME\linkedin-social-mcp\scheduler-daemon.mjs" `
  -WorkingDirectory "C:\Users\$env:USERNAME\linkedin-social-mcp"

$trigger = New-ScheduledTaskTrigger `
  -RepetitionInterval (New-TimeSpan -Seconds 60) `
  -Once -At (Get-Date)

$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0

Register-ScheduledTask `
  -TaskName "LinkedInMCPScheduler" `
  -Action $action -Trigger $trigger -Settings $settings `
  -RunLevel Highest -Force
```

> **You should see:** `TaskName: LinkedInMCPScheduler` with `State: Ready` ✅

---

### Scheduler Option B — GitHub Cloud (works even when laptop is off) ⭐ Recommended

This runs in the cloud every 5 minutes, 24/7. Your laptop doesn't need to be on.

The workflow file is **already included** in the repo. You just need to add your credentials as GitHub secrets once.

**Step 1 — Fork the repo to your GitHub account**

If you haven't already:
1. Go to **https://github.com/amit123amit/linkedin-social-mcp**
2. Click the **"Fork"** button (top right)
3. Click **"Create Fork"**

Now you have your own copy at `https://github.com/YOUR_GITHUB_USERNAME/linkedin-social-mcp`

**Step 2 — Get the three values you need:**

Open Terminal and run each line separately:

```bash
# 1. Your Refresh Token (valid for ~1 year)
cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token
```
Copy the long token value inside the quotes.

```bash
# 2. Your Client ID and Secret
cat ~/linkedin-social-mcp/.env
```
Copy the `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` values.

**Step 3 — Add them as GitHub secrets:**

1. Go to your forked repo on GitHub
2. Click **Settings** (top menu of the repo)
3. In the left sidebar, click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"** and add each of these:

| Secret Name | Value |
|---|---|
| `LINKEDIN_CLIENT_ID` | Your LinkedIn app Client ID |
| `LINKEDIN_CLIENT_SECRET` | Your LinkedIn app Client Secret |
| `LINKEDIN_REFRESH_TOKEN` | The refresh_token value from Step 2 |

> **Why three secrets?** The scheduler uses your refresh token to automatically get a fresh access token on every run — no manual updates needed for ~1 year. Much better than the old approach of updating a token every 60 days.

**Step 4 — Test it:**

1. Go to your repo on GitHub
2. Click the **"Actions"** tab
3. Click **"LinkedIn Post Scheduler"** in the left list
4. Click **"Run workflow"** → **"Run workflow"** (green button)
5. Wait a few seconds, then click the run to see logs

> **You should see in the logs:**
> ```
> GitHub Actions mode: exchanging refresh_token for access token...
> ✅ Access token refreshed successfully via refresh_token
> Scheduler daemon started
> No posts due. Total scheduled: 0
> ```
> ✅ That means it's working perfectly.

---

## Token Expiry — What Happens & How to Fix

LinkedIn access tokens last **60 days** and refresh tokens last **365 days**.

| | What happens | Action needed |
|---|---|---|
| **Access token expires (60 days)** | Auto-refreshed silently | Nothing — fully automatic ✅ |
| **Refresh token expires (365 days)** | Posts stop publishing | Re-run `npm run auth` (2 min fix) |

**The scheduler warns you 14 days before expiry.** Check logs anytime:
```bash
tail -20 ~/.linkedin-social-mcp/scheduler.log
```

**When your refresh token expires — full recovery (2 minutes):**

```bash
# Step 1 — Log in again to get a new token
cd ~/linkedin-social-mcp && npm run auth
# (Log in via browser and approve permissions)

# Step 2 — Get your new refresh token
cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token
```

Then go to your GitHub repo → **Settings → Secrets → Actions** and update `LINKEDIN_REFRESH_TOKEN` with the new value.

> **Tip:** Set a calendar reminder for every 11 months so you never get caught off guard.

---

## Using It — Example Prompts

Once set up, just open Claude and type naturally:

**Post right now:**
> *"Post on my LinkedIn: 'Excited to share this milestone with my network!'"*

> *"Post on our HealthyBite company page: 'New product launching this week! 🌿'"*

**Schedule for later:**
> *"Schedule a LinkedIn post for tomorrow at 9am: 'Happy Tuesday everyone!'"*

> *"Schedule a post on our company page for May 15th at 10am: 'Big news coming...'"*

**Manage scheduled posts:**
> *"Show me all my scheduled LinkedIn posts"*

> *"Cancel my scheduled post from HealthyBite for tomorrow"*

**Preview before publishing:**
> *"Preview this post before I publish it: 'Excited to announce our new product... #startup #AI'"*

**Analytics:**
> *"How many followers does our company page have?"*

> *"Show me the page views for our LinkedIn company page this month"*

> *"What's the engagement on our recent posts?"*

**Org page management:**
> *"List all admins on our LinkedIn company page"*

> *"What are my LinkedIn connection count?"*

---

## Troubleshooting

**"Not authenticated" error in Claude**
→ Run `cd ~/linkedin-social-mcp && npm run auth` and log in again.

**Scheduled post didn't publish**
→ Check the scheduler is running: `launchctl list | grep linkedin`
→ Check logs: `tail -30 ~/.linkedin-social-mcp/scheduler.log`
→ Make sure the GitHub Actions secret `LINKEDIN_REFRESH_TOKEN` is set.

**"Module not found" or build errors**
→ Run `cd ~/linkedin-social-mcp && npm install && npm run build` again.

**Claude says it can't find the LinkedIn tools**
→ Make sure the path in your Claude settings file is the correct absolute path to `dist/index.js`.
→ Restart Claude Code or Claude Desktop after editing the settings file.

**GitHub Actions workflow shows failure**
→ Go to repo → Actions → click the failed run → check the logs for the specific error message.
→ Most common cause: missing or incorrect GitHub secrets. Double-check all three secrets are set.

---

## Project Files

You don't need to touch these — just good to know what they are:

```
linkedin-social-mcp/
├── scheduler-daemon.mjs     ← The background scheduler that publishes due posts
├── scheduled-posts.json     ← List of posts queued for publishing (synced with GitHub)
├── .github/workflows/
│   └── scheduler.yml        ← GitHub Actions cloud scheduler (runs every 5 min)
├── dist/
│   └── index.js             ← The built MCP server (generated by npm run build)
└── src/                     ← Source code (you don't need to touch this)
```

---

## Security

- Your LinkedIn credentials are stored only on your computer at `~/.linkedin-social-mcp/tokens.json`
- The file is private (only you can read it)
- Your `.env` file is never uploaded to GitHub (it's in `.gitignore`)
- GitHub secrets are encrypted and never visible in logs

---

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

[MIT](LICENSE)
