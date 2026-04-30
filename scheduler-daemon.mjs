#!/usr/bin/env node
/**
 * LinkedIn Social MCP — Standalone Scheduler Daemon
 *
 * Runs independently of Claude Code. Reads scheduled-posts.json,
 * publishes due posts via LinkedIn API, updates store status.
 *
 * Designed to be called by:
 *   - macOS LaunchAgent (every 60s, when laptop is on)
 *   - GitHub Actions cron (every 5 min, 24/7 cloud fallback)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const STORE_DIR   = path.join(os.homedir(), '.linkedin-social-mcp');
const STORE_PATH  = path.join(STORE_DIR, 'scheduled-posts.json');
const TOKEN_PATH  = path.join(STORE_DIR, 'tokens.json');
const LOG_PATH    = path.join(STORE_DIR, 'scheduler.log');

const LINKEDIN_API_V2   = 'https://api.linkedin.com/v2';
const LINKEDIN_VERSION  = '202601';

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
    // Keep log under 500 lines
    const lines = fs.readFileSync(LOG_PATH, 'utf-8').split('\n');
    if (lines.length > 500) {
      fs.writeFileSync(LOG_PATH, lines.slice(-400).join('\n') + '\n');
    }
  } catch { /* ignore log write errors */ }
}

// ─── Token ────────────────────────────────────────────────────────────────────

function getAccessToken() {
  // Support GitHub Actions via env var
  if (process.env.LINKEDIN_ACCESS_TOKEN) return process.env.LINKEDIN_ACCESS_TOKEN;

  if (!fs.existsSync(TOKEN_PATH)) throw new Error('No token file found at ' + TOKEN_PATH);
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at && tokens.expires_at < now + 300) {
    throw new Error('LinkedIn token expired. Re-run: npm run auth in linkedin-social-mcp/');
  }
  return tokens.access_token;
}

// ─── LinkedIn API ─────────────────────────────────────────────────────────────

async function publishPost(token, post) {
  const body = {
    author: post.authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: post.text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': post.visibility ?? 'PUBLIC',
    },
  };

  const res = await fetch(`${LINKEDIN_API_V2}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn ${res.status}: ${text}`);
  }

  const urn = res.headers.get('x-restli-id') || res.headers.get('location') || '';
  return urn;
}

// ─── Store ────────────────────────────────────────────────────────────────────

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) return [];
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
}

function saveStore(posts) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(posts, null, 2), { mode: 0o600 });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('Scheduler daemon started');

  let token;
  try {
    token = getAccessToken();
  } catch (err) {
    log(`ERROR: ${err.message}`);
    process.exit(1);
  }

  const posts = loadStore();
  const now = new Date();
  const due = posts.filter(
    p => p.status === 'SCHEDULED' && new Date(p.scheduledFor) <= now
  );

  if (due.length === 0) {
    log(`No posts due. Total scheduled: ${posts.filter(p => p.status === 'SCHEDULED').length}`);
    return;
  }

  log(`Found ${due.length} post(s) due for publishing`);

  for (const post of due) {
    try {
      log(`Publishing: "${post.text.slice(0, 60)}..." (${post.type} | ${post.authorUrn})`);
      const realUrn = await publishPost(token, post);

      // Update store
      const idx = posts.findIndex(p => p.postUrn === post.postUrn);
      if (idx !== -1) {
        posts[idx].status = 'PUBLISHED';
        posts[idx].publishedAt = new Date().toISOString();
        if (realUrn) posts[idx].postUrn = realUrn;
      }
      saveStore(posts);
      log(`✅ Published: ${realUrn || post.postUrn}`);
    } catch (err) {
      log(`❌ Failed to publish ${post.postUrn}: ${err.message}`);
    }
  }

  log('Scheduler daemon done');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
