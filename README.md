# LinkedIn Social MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![LinkedIn API](https://img.shields.io/badge/LinkedIn-Share%20on%20LinkedIn-0a66c2)](https://www.linkedin.com/developers/)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude full access to LinkedIn's **Share on LinkedIn** API — post, comment, react, **schedule**, preview, manage organization pages, and pull analytics, all from within Claude.

> **Scheduling works 24/7** — even when your laptop is off — via a local background daemon + GitHub Actions cloud fallback.

---

# Quick Install (No Coding Required!)

**Don't want to deal with technical setup?** Just copy one of the prompts below and paste it into Claude. The AI will handle everything for you!

---

## Option 1: Install with Claude Code (Recommended)

If you have [Claude Code](https://claude.ai/code) installed, copy and paste this entire prompt:

<details>
<summary><strong>Click to expand the Claude Code installation prompt</strong></summary>

```
Please set up the LinkedIn Social MCP server on my machine by following these steps exactly:

1. Check that Node.js 18+ is installed by running `node --version`. If not installed, tell me to install it from https://nodejs.org first.

2. Clone the repository:
   git clone https://github.com/amit123amit/linkedin-social-mcp.git ~/linkedin-social-mcp

3. Install dependencies and build:
   cd ~/linkedin-social-mcp && npm install && npm run build

4. Set up the environment file:
   cp ~/linkedin-social-mcp/.env.example ~/linkedin-social-mcp/.env

5. Ask me for my LinkedIn App credentials:
   - Tell me to go to https://www.linkedin.com/developers/apps
   - Create an app and add the "Share on LinkedIn" product
   - Under Auth settings, add redirect URL: http://localhost:3000/callback
   - Copy the Client ID and Client Secret

6. Once I provide my Client ID and Client Secret, write them into ~/linkedin-social-mcp/.env

7. Add the MCP server to my Claude Code settings by editing ~/.claude/settings.json to add:
   {
     "mcpServers": {
       "linkedin-social": {
         "command": "node",
         "args": ["<full-path-to>/linkedin-social-mcp/dist/index.js"],
         "env": {
           "LINKEDIN_CLIENT_ID": "<my-client-id>",
           "LINKEDIN_CLIENT_SECRET": "<my-client-secret>"
         }
       }
     }
   }
   Use the actual full path to the cloned repo.

8. Run authentication:
   cd ~/linkedin-social-mcp && npm run auth
   Tell me to complete the LinkedIn login in the browser window that opens.

9. Set up the background scheduler so scheduled posts fire automatically:

   a) Install the macOS LaunchAgent (runs every 60s when laptop is on):
      mkdir -p ~/Library/LaunchAgents
      NODE_PATH=$(which node)
      REPO_PATH=~/linkedin-social-mcp
      cat > ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist << EOF
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0"><dict>
        <key>Label</key><string>com.linkedin.social.mcp.scheduler</string>
        <key>ProgramArguments</key>
        <array>
          <string>${NODE_PATH}</string>
          <string>${REPO_PATH}/scheduler-daemon.mjs</string>
        </array>
        <key>StartInterval</key><integer>60</integer>
        <key>RunAtLoad</key><true/>
        <key>KeepAlive</key><false/>
        <key>StandardOutPath</key><string>/Users/$USER/.linkedin-social-mcp/launchagent-stdout.log</string>
        <key>StandardErrorPath</key><string>/Users/$USER/.linkedin-social-mcp/launchagent-stderr.log</string>
        <key>EnvironmentVariables</key>
        <dict>
          <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
          <key>HOME</key><string>/Users/$USER</string>
        </dict>
        <key>WorkingDirectory</key><string>${REPO_PATH}</string>
      </dict></plist>
      EOF
      launchctl load ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist
      echo "LaunchAgent loaded!"

   b) Verify it is running:
      launchctl list | grep linkedin

   c) Tell me to set up the GitHub Actions cloud scheduler (for when laptop is off):
      - Go to https://github.com/YOUR_USERNAME/linkedin-social-mcp/settings/secrets/actions
        (replace YOUR_USERNAME with their GitHub username)
      - Add these three secrets (click "New repository secret" for each):
        1. Name: LINKEDIN_CLIENT_ID
           Value: your LinkedIn app Client ID (from https://www.linkedin.com/developers/apps)
        2. Name: LINKEDIN_CLIENT_SECRET
           Value: your LinkedIn app Client Secret (from the same app page)
        3. Name: LINKEDIN_REFRESH_TOKEN
           Value: run this in Terminal: cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token
                  Copy only the token value (the long string inside the quotes)
      - These secrets are valid for ~1 year (refresh token TTL). The workflow auto-refreshes the access token on every run.
      The GitHub Actions workflow is already included in the repo and runs every 5 minutes automatically.

10. Confirm setup is complete and suggest a test prompt like:
    "Schedule a LinkedIn post for 5 minutes from now: Hello from my automated scheduler!"
```

</details>

---

## Option 2: Install with Claude Desktop (Chat-Based)

Using Claude Desktop? Copy and paste this prompt to get a guided, step-by-step installation:

<details>
<summary><strong>Click to expand the Claude Desktop installation prompt</strong></summary>

```
I want to set up the LinkedIn Social MCP server so you can post, schedule, and manage my LinkedIn content. Please guide me through the installation step by step. Wait for my confirmation at each step before moving to the next.

Step 1 — Check prerequisites:
Ask me to open my Terminal and run: node --version
Tell me I need Node.js version 18 or higher. If I don't have it, tell me to download it from https://nodejs.org

Step 2 — Clone the repository:
Ask me to run this in Terminal:
git clone https://github.com/amit123amit/linkedin-social-mcp.git ~/linkedin-social-mcp

Step 3 — Install and build:
Ask me to run:
cd ~/linkedin-social-mcp && npm install && npm run build
Tell me this may take a minute or two.

Step 4 — Create LinkedIn App credentials:
Tell me to:
a) Go to https://www.linkedin.com/developers/apps
b) Click "Create App" and fill in the details
c) Under Products, request access to "Share on LinkedIn"
d) Under Auth tab, add this Redirect URL exactly: http://localhost:3000/callback
e) Copy the Client ID and Client Secret shown on the Auth tab
Ask me to share my Client ID and Client Secret (reassure me they stay local).

Step 5 — Set up environment:
Once I give you the credentials, tell me to run:
cp ~/linkedin-social-mcp/.env.example ~/linkedin-social-mcp/.env
Then tell me to open ~/linkedin-social-mcp/.env in a text editor and fill in:
LINKEDIN_CLIENT_ID=<my-client-id>
LINKEDIN_CLIENT_SECRET=<my-client-secret>

Step 6 — Add to Claude Desktop config:
Tell me to open this file in a text editor:
- Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
- Windows: %APPDATA%\Claude\claude_desktop_config.json
And add this inside the "mcpServers" section (adjust the path to match where I cloned the repo):
"linkedin-social": {
  "command": "node",
  "args": ["/Users/YOUR_USERNAME/linkedin-social-mcp/dist/index.js"],
  "env": {
    "LINKEDIN_CLIENT_ID": "my-client-id-here",
    "LINKEDIN_CLIENT_SECRET": "my-client-secret-here"
  }
}

Step 7 — Authenticate:
Tell me to run in Terminal:
cd ~/linkedin-social-mcp && npm run auth
A browser window will open. Tell me to log in with my LinkedIn account and approve the permissions.

Step 8 — Restart and test:
Tell me to restart Claude Desktop completely.
Then suggest I test it by typing: "Get my LinkedIn profile"

Step 9 — Set up the background scheduler (required for scheduled posts):
Tell me about both options below and ask which I prefer.

OPTION A — macOS LaunchAgent (laptop must be on):
Ask me to run in Terminal:
  launchctl load ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist
Tell me this runs the scheduler every 60 seconds in the background and will auto-start on login.
Ask me to verify with: launchctl list | grep linkedin

OPTION B — GitHub Actions (works 24/7, even when laptop is off):
Tell me to:
1. Fork the repo to my own GitHub account at https://github.com/amit123amit/linkedin-social-mcp
2. Go to my fork → Settings → Secrets and variables → Actions
3. Add these three secrets (New repository secret for each):
   - LINKEDIN_CLIENT_ID: their LinkedIn app Client ID
   - LINKEDIN_CLIENT_SECRET: their LinkedIn app Client Secret
   - LINKEDIN_REFRESH_TOKEN: run in Terminal: cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token
     (copy the long token value)
4. These secrets are valid for ~1 year. The workflow auto-refreshes the access token on every run.
Tell me the GitHub Actions cron workflow is already in the repo — it runs every 5 minutes automatically.
Recommend Option B for reliability, or both together for best coverage.

Confirm everything is working and explain what I can do with this MCP server.
```

</details>

---

## Features

| Scope | What you can do |
|---|---|
| `r_basicprofile` | Read your LinkedIn profile |
| `r_1st_connections_size` | Get your 1st-degree connection count |
| `w_member_social` | Create/delete posts, comments, reactions, and schedule posts as yourself |
| `r_organization_social` | Read organization posts, comments, and reactions |
| `w_organization_social` | Post, comment, and schedule posts on behalf of your organization page |
| `rw_organization_admin` | Get and update organization page details and admins |
| `r_organization_admin` | Pull follower, visitor, and content analytics |

### Tools (27 total)

**Profile & Network**
- `get_my_profile` — your name, headline, profile URL
- `get_connection_count` — number of 1st-degree connections

**Compose & Preview**
- `preview_post` — validate and preview a post before publishing (character count, hashtag analysis, formatting warnings — no API call)

**Member Posts**
- `create_text_post` — text post as yourself
- `create_link_post` — post with article/URL preview
- `delete_post` — delete your post
- `create_comment` — comment on any post
- `delete_comment` — delete your comment
- `react_to_post` — like a post
- `remove_reaction` — unlike a post

**Scheduling (Member)**
- `schedule_post` — schedule a personal post for a future date/time

**Organization Posts**
- `create_org_text_post` — text post as your org page
- `create_org_link_post` — article post as your org page
- `delete_org_post` — delete an org post
- `get_org_posts` — list your org's recent posts
- `create_org_comment` — comment as your org page
- `get_post_comments` — read comments on any post
- `get_post_reactions` — read reactions on any post

**Scheduling (Organization)**
- `schedule_org_post` — schedule an org page post for a future date/time

**Scheduling (Member & Organization — shared)**
- `list_scheduled_posts` — view all pending scheduled posts for a member OR org (pass either `urn:li:person:{id}` or `urn:li:organization:{id}`)
- `cancel_scheduled_post` — cancel and delete any scheduled post, whether personal or org

**Organization Management**
- `get_organization` — org details, followers, industry
- `update_organization` — update description or website
- `get_organization_admins` — list admins and their roles

**Organization Analytics**
- `get_follower_statistics` — total followers + demographics (region, industry, seniority, function)
- `get_page_statistics` — page views and unique visitors
- `get_content_statistics` — impressions, clicks, likes, shares, engagement rate

---

## Manual Setup (Developer)

### Prerequisites
- Node.js 18+
- A LinkedIn Developer App with the **"Share on LinkedIn"** product enabled

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create App**
3. Under **Products**, request access to **Share on LinkedIn**
4. Under **Auth**, add `http://localhost:3000/callback` as a Redirect URL
5. Copy your **Client ID** and **Client Secret**

### 2. Install & Configure

```bash
git clone https://github.com/amit123amit/linkedin-social-mcp.git
cd linkedin-social-mcp
npm install
cp .env.example .env
# Edit .env with your Client ID and Client Secret
```

### 3. Authenticate

```bash
npm run auth
```

This opens LinkedIn in your browser. Sign in and approve the permissions. Your token is saved securely to `~/.linkedin-social-mcp/tokens.json` (file permissions: 600).

```bash
npm run auth status   # check token validity and granted scopes
npm run auth logout   # clear saved tokens
```

### 4. Build

```bash
npm run build
```

### 5. Add to Claude Code

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "linkedin-social": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-social-mcp/dist/index.js"],
      "env": {
        "LINKEDIN_CLIENT_ID": "your_client_id",
        "LINKEDIN_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### 6. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "linkedin-social": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-social-mcp/dist/index.js"],
      "env": {
        "LINKEDIN_CLIENT_ID": "your_client_id",
        "LINKEDIN_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Scheduler Setup (Required for Scheduled Posts)

> **How scheduling works:** When you ask Claude to schedule a post, it is saved locally to `~/.linkedin-social-mcp/scheduled-posts.json`. A background daemon checks this file periodically and publishes any posts that are due — calling the LinkedIn API directly at the right time.

LinkedIn's standard API does not support server-side scheduled posts for third-party apps, so this local scheduler approach gives you reliable, flexible scheduling for any date/time in the future.

There are two complementary options. **We recommend setting up both** for maximum reliability.

---

### Option A — macOS LaunchAgent (when laptop is on)

The LaunchAgent runs `scheduler-daemon.mjs` every **60 seconds** in the background. It starts automatically when you log in and requires no ongoing action.

**Step 1 — Create the plist file:**

Run the following in Terminal (replace `/opt/homebrew/bin/node` with your actual `node` path from `which node`):

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.linkedin.social.mcp.scheduler</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/YOUR_USERNAME/linkedin-social-mcp/scheduler-daemon.mjs</string>
    </array>
    <key>StartInterval</key>
    <integer>60</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/.linkedin-social-mcp/launchagent-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/.linkedin-social-mcp/launchagent-stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>/Users/YOUR_USERNAME</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/linkedin-social-mcp</string>
</dict>
</plist>
EOF
```

Replace `YOUR_USERNAME` with your macOS username (run `whoami` in Terminal to check).

**Step 2 — Load the LaunchAgent:**

```bash
launchctl load ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist
```

**Step 3 — Verify it is running:**

```bash
launchctl list | grep linkedin
# Expected output (PID will differ):
# 50735   0   com.linkedin.social.mcp.scheduler
```

**Common LaunchAgent commands:**

```bash
# Stop the scheduler
launchctl unload ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist

# Restart it
launchctl unload ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist
launchctl load ~/Library/LaunchAgents/com.linkedin.social.mcp.scheduler.plist

# View scheduler logs
tail -f ~/.linkedin-social-mcp/scheduler.log
```

---

### Option B — GitHub Actions Cloud Scheduler (24/7, even when laptop is off)

The GitHub Actions workflow (`.github/workflows/scheduler.yml`) is **already included in this repo**. It runs every **5 minutes, 24/7** on GitHub's servers — your laptop does not need to be on.

**The only setup step is adding your LinkedIn token as a GitHub secret:**

**Step 1 — Get your LinkedIn access token:**

```bash
cat ~/.linkedin-social-mcp/tokens.json
```

Copy the value of `access_token` — it's the long string (looks like `AQV...`).

**Step 2 — Add three secrets to GitHub (one-time setup, valid for ~1 year):**

1. Go to your forked repo on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these three secrets one by one (click **New repository secret** for each):

| Secret Name | How to get the value |
|---|---|
| `LINKEDIN_CLIENT_ID` | From your LinkedIn Developer App → Auth tab |
| `LINKEDIN_CLIENT_SECRET` | From your LinkedIn Developer App → Auth tab |
| `LINKEDIN_REFRESH_TOKEN` | Run: `cat ~/.linkedin-social-mcp/tokens.json \| grep refresh_token` — copy the value |

> **Why three secrets instead of one?** With the refresh token approach, GitHub Actions automatically exchanges your refresh token for a fresh access token on every run. You only need to update these secrets **once a year** when the refresh token expires (~365 days), instead of every 60 days with the old static token approach.

**Step 3 — Verify the workflow is active:**

1. Go to your repo → **Actions** tab
2. You should see **"LinkedIn Post Scheduler"** listed
3. Click on it → click **Run workflow** to trigger a manual test run
4. Check the logs — you should see: `Scheduler daemon started` → `✅ Access token refreshed successfully` → `No posts due.`

**How GitHub Actions syncs scheduled posts:**

When you schedule a post via Claude, it is saved to `~/.linkedin-social-mcp/scheduled-posts.json` on your local machine. For GitHub Actions to pick it up, you need to also commit the updated `scheduled-posts.json` to your repo:

```bash
cd ~/linkedin-social-mcp
cp ~/.linkedin-social-mcp/scheduled-posts.json scheduled-posts.json
git add scheduled-posts.json
git commit -m "chore: add scheduled posts"
git push
```

> **Tip:** Ask Claude to do this for you after scheduling a post: *"Push the updated scheduled-posts.json to GitHub so the cloud scheduler picks it up."*

When the GitHub Actions workflow publishes a post, it automatically commits the updated `scheduled-posts.json` back to the repo with the new `PUBLISHED` status.

---

### Token Expiry & Automatic Refresh

LinkedIn tokens have two layers:

| Token | Expires | Handled by |
|---|---|---|
| **Access token** | ~60 days | ✅ Auto-refreshed locally by `token-store.ts` — no action needed |
| **Refresh token** | ~365 days | ⚠️ Requires manual re-auth once a year |

**For local use (MCP server + LaunchAgent):** Fully automatic. The MCP server silently refreshes the access token in the background using the refresh token. You will not need to do anything for the first ~365 days.

**For GitHub Actions:** Automatic once set up with the three secrets above. The scheduler exchanges the refresh token for a fresh access token on every run.

**When the refresh token expires (once a year):**

The scheduler log will show:
```
⚠️  WARNING: LinkedIn access token expires in X day(s)!
```
...with exact recovery steps printed automatically. You will also see this in GitHub Actions logs.

**Recovery steps (takes ~2 minutes):**

```bash
# Step 1 — Re-authenticate to get a new refresh token
cd ~/linkedin-social-mcp && npm run auth
# (Log in via browser and approve permissions)

# Step 2 — Update the GitHub secret
cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token
# Copy the value, then go to:
# https://github.com/YOUR_REPO/settings/secrets/actions
# Update LINKEDIN_REFRESH_TOKEN with the new value

# Step 3 — Verify
launchctl list | grep linkedin            # local scheduler still running
tail -20 ~/.linkedin-social-mcp/scheduler.log  # check for errors
```

> **Tip:** Set a calendar reminder every **11 months** to refresh your tokens before they expire.

---

## Usage Examples

Once connected, try these prompts in Claude:

**Posting**
> *"Post on LinkedIn: 'Excited to share our latest update!' with the link https://example.com"*

> *"Post this on our company LinkedIn page: 'We're hiring! Check our open roles.'"*

**Scheduling**
> *"Schedule a LinkedIn post for next Monday at 9am: 'Happy Monday! Here's our weekly tip...'"*

> *"Schedule a post on our company page for May 15th at 10am PST with this text: 'Big announcement coming...'"*

> *"Show me all my scheduled LinkedIn posts"*

> *"Cancel the scheduled post urn:li:ugcPost:1234567890"*

**Preview before posting**
> *"Preview this LinkedIn post before I publish it: 'Excited to announce... #AI #startup'"*

**Analytics**
> *"Get the follower statistics for our company page (org ID: 12345678)"*

> *"Show me page views for our LinkedIn company page this month"*

> *"What's the engagement rate on our recent org posts?"*

**Management**
> *"What's my LinkedIn connection count?"*

> *"List all admins on our LinkedIn company page"*

---

## Security

- OAuth tokens stored at `~/.linkedin-social-mcp/tokens.json` with `600` permissions (owner only)
- Token directory created with `700` permissions
- Tokens auto-refresh before expiry when a refresh token is available
- Never commit your `.env` file — it's in `.gitignore`
- `LINKEDIN_ACCESS_TOKEN` GitHub secret is encrypted at rest and never exposed in logs

---

## Project Structure

```
linkedin-social-mcp/
├── scheduler-daemon.mjs          # Standalone scheduler daemon (zero dependencies)
├── scheduled-posts.json          # Repo-level store synced by GitHub Actions
├── .github/
│   └── workflows/
│       └── scheduler.yml         # GitHub Actions cron: runs every 5 min, 24/7
├── src/
│   ├── index.ts                  # MCP server entry point (27 tools)
│   ├── auth-cli.ts               # CLI: npm run auth [login|status|logout]
│   ├── auth/
│   │   ├── oauth.ts              # OAuth 2.0 flow with CSRF protection
│   │   ├── token-store.ts        # Token persistence & auto-refresh
│   │   └── scheduled-post-store.ts  # Local scheduled post persistence
│   ├── lib/
│   │   ├── linkedin-api.ts       # LinkedIn REST API client (v2 + versioned)
│   │   └── types.ts              # TypeScript interfaces
│   └── tools/
│       ├── profile.ts            # get_my_profile, get_connection_count
│       ├── member-posts.ts       # Personal post/comment/react tools
│       ├── org-posts.ts          # Organization post tools
│       ├── org-management.ts     # Organization page management
│       ├── org-analytics.ts      # Follower, page & content analytics
│       └── scheduling.ts         # preview_post, schedule_post, schedule_org_post, list/cancel
└── ~/Library/LaunchAgents/
    └── com.linkedin.social.mcp.scheduler.plist  # macOS LaunchAgent (created during setup)
```

---

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

[MIT](LICENSE)
