# LinkedIn Social MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![LinkedIn API](https://img.shields.io/badge/LinkedIn-Share%20on%20LinkedIn-0a66c2)](https://www.linkedin.com/developers/)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude full access to LinkedIn's **Share on LinkedIn** API — post, comment, react, schedule, preview, manage organization pages, and pull analytics, all from within Claude.

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

9. Confirm setup is complete and suggest a test prompt like:
   "Get my LinkedIn profile" or "Show me the last 5 posts from my LinkedIn company page"
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
- `list_scheduled_posts` — view all your pending scheduled posts
- `cancel_scheduled_post` — cancel a scheduled post

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

---

## Project Structure

```
src/
├── index.ts               # MCP server entry point (27 tools)
├── auth-cli.ts            # CLI: npm run auth [login|status|logout]
├── auth/
│   ├── oauth.ts           # OAuth 2.0 flow with CSRF protection
│   └── token-store.ts     # Token persistence & auto-refresh
├── lib/
│   ├── linkedin-api.ts    # LinkedIn REST API client (v2 + versioned)
│   └── types.ts           # TypeScript interfaces
└── tools/
    ├── profile.ts         # get_my_profile, get_connection_count
    ├── member-posts.ts    # Personal post/comment/react tools
    ├── org-posts.ts       # Organization post tools
    ├── org-management.ts  # Organization page management
    ├── org-analytics.ts   # Follower, page & content analytics
    └── scheduling.ts      # preview_post, schedule_post, schedule_org_post, list/cancel
```

---

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

[MIT](LICENSE)
