# LinkedIn Social MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude full access to LinkedIn's **Share on LinkedIn** API — post, comment, react, manage organization pages, and pull analytics, all from within Claude.

---

## Features

| Scope | What you can do |
|---|---|
| `r_basicprofile` | Read your LinkedIn profile |
| `r_1st_connections_size` | Get your 1st-degree connection count |
| `w_member_social` | Create/delete posts, comments, and reactions as yourself |
| `r_organization_social` | Read organization posts, comments, and reactions |
| `w_organization_social` | Post, comment on behalf of your organization page |
| `rw_organization_admin` | Get and update organization page details and admins |
| `r_organization_admin` | Pull follower, visitor, and content analytics |

### Tools (22 total)

**Profile & Network**
- `get_my_profile` — your name, headline, profile URL
- `get_connection_count` — number of 1st-degree connections

**Member Posts**
- `create_text_post` — text post as yourself
- `create_link_post` — post with article/URL preview
- `delete_post` — delete your post
- `create_comment` — comment on any post
- `delete_comment` — delete your comment
- `react_to_post` — like a post
- `remove_reaction` — unlike a post

**Organization Posts**
- `create_org_text_post` — text post as your org page
- `create_org_link_post` — article post as your org page
- `delete_org_post` — delete an org post
- `get_org_posts` — list your org's recent posts
- `create_org_comment` — comment as your org page
- `get_post_comments` — read comments on any post
- `get_post_reactions` — read reactions on any post

**Organization Management**
- `get_organization` — org details, followers, industry
- `update_organization` — update description or website
- `get_organization_admins` — list admins and their roles

**Organization Analytics**
- `get_follower_statistics` — total followers + demographics (region, industry, seniority, function)
- `get_page_statistics` — page views and unique visitors
- `get_content_statistics` — impressions, clicks, likes, shares, engagement rate

---

## Prerequisites

- Node.js 18+
- A LinkedIn Developer App with the **"Share on LinkedIn"** product enabled

---

## Setup

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create App**
3. Under **Products**, request access to **Share on LinkedIn**
4. Under **Auth**, add `http://localhost:3000/callback` as a redirect URL
5. Copy your **Client ID** and **Client Secret**

### 2. Install & Configure

```bash
git clone https://github.com/your-username/linkedin-social-mcp
cd linkedin-social-mcp

npm install

cp .env.example .env
# Edit .env with your Client ID and Client Secret
```

### 3. Authenticate

```bash
npm run auth
```

This opens LinkedIn in your browser. Sign in and approve the requested permissions. Your token is saved securely to `~/.linkedin-social-mcp/tokens.json` (permissions: 600).

Other auth commands:
```bash
npm run auth status   # check token validity
npm run auth logout   # clear saved tokens
```

### 4. Build

```bash
npm run build
```

### 5. Add to Claude

Add to your `~/.claude/settings.json` (Claude Code) or `claude_desktop_config.json` (Claude Desktop):

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

---

## Usage Examples

Once connected to Claude, you can say things like:

> *"Post on LinkedIn: 'Excited to share our latest product update — check the link below!' with the URL https://example.com/update"*

> *"Get the follower statistics for our company page (org ID: 12345678)"*

> *"Show me the last 5 posts from our LinkedIn company page"*

> *"What's my connection count on LinkedIn?"*

> *"Comment 'Great insights!' on this post: urn:li:ugcPost:1234567890"*

---

## Security

- OAuth tokens are stored at `~/.linkedin-social-mcp/tokens.json` with `600` permissions (owner read/write only)
- The directory is created with `700` permissions
- Tokens are automatically refreshed before expiry if a refresh token is available
- Never commit your `.env` file or token files

---

## Project Structure

```
src/
├── index.ts              # MCP server entry point
├── auth-cli.ts           # CLI authentication helper
├── auth/
│   ├── oauth.ts          # OAuth 2.0 flow
│   └── token-store.ts    # Token persistence & refresh
├── lib/
│   ├── linkedin-api.ts   # LinkedIn REST API client
│   └── types.ts          # TypeScript interfaces
└── tools/
    ├── profile.ts         # get_my_profile, get_connection_count
    ├── member-posts.ts    # Personal post/comment/react tools
    ├── org-posts.ts       # Organization post tools
    ├── org-management.ts  # Organization page management
    └── org-analytics.ts   # Follower, page & content analytics
```

---

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

MIT
