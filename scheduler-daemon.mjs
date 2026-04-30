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
 *
 * Token strategy:
 *   1. GitHub Actions (preferred): auto-refreshes via LINKEDIN_REFRESH_TOKEN
 *      + LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET — only needs updating once/year
 *   2. GitHub Actions (legacy): static LINKEDIN_ACCESS_TOKEN — needs updating every 60 days
 *   3. Local: reads tokens.json, warns if expiring within 14 days
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const STORE_DIR   = path.join(os.homedir(), '.linkedin-social-mcp');
const STORE_PATH  = path.join(STORE_DIR, 'scheduled-posts.json');
const TOKEN_PATH  = path.join(STORE_DIR, 'tokens.json');
const LOG_PATH    = path.join(STORE_DIR, 'scheduler.log');

const LINKEDIN_API_V2   = 'https://api.linkedin.com/v2';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
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

/**
 * Returns a valid access token using one of three strategies (in priority order):
 *
 * 1. GitHub Actions with refresh token (recommended):
 *    Set secrets: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REFRESH_TOKEN
 *    → Automatically exchanges refresh_token for a fresh access token each run.
 *    → Only needs updating once a year when the refresh token expires (~365 days).
 *
 * 2. GitHub Actions with static token (legacy):
 *    Set secret: LINKEDIN_ACCESS_TOKEN
 *    → Uses the token directly, no refresh. Needs manual update every ~60 days.
 *
 * 3. Local execution (macOS LaunchAgent / manual run):
 *    Reads from ~/.linkedin-social-mcp/tokens.json
 *    → Auto-refreshed by the MCP server's token-store.ts. Warns if expiring soon.
 */
async function getAccessToken() {
  // Strategy 1: GitHub Actions with refresh token (preferred)
  if (process.env.LINKEDIN_CLIENT_ID &&
      process.env.LINKEDIN_CLIENT_SECRET &&
      process.env.LINKEDIN_REFRESH_TOKEN) {
    log('GitHub Actions mode: exchanging refresh_token for access token...');
    return await refreshTokenGrant(
      process.env.LINKEDIN_CLIENT_ID,
      process.env.LINKEDIN_CLIENT_SECRET,
      process.env.LINKEDIN_REFRESH_TOKEN,
    );
  }

  // Strategy 2: GitHub Actions with static token (legacy fallback)
  if (process.env.LINKEDIN_ACCESS_TOKEN) {
    log('GitHub Actions mode: using static LINKEDIN_ACCESS_TOKEN');
    return process.env.LINKEDIN_ACCESS_TOKEN;
  }

  // Strategy 3: Local — read from tokens.json with expiry warnings
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `No token file found at ${TOKEN_PATH}\n` +
      `Fix: cd ~/linkedin-social-mcp && npm run auth`
    );
  }

  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const now = Math.floor(Date.now() / 1000);
  const secsLeft = tokens.expires_at - now;
  const daysLeft = Math.floor(secsLeft / 86400);

  if (secsLeft <= 0) {
    // Token already expired
    log(`❌ ERROR: LinkedIn access token EXPIRED ${Math.abs(daysLeft)} day(s) ago.`);
    logRecoverySteps();
    throw new Error('LinkedIn token expired. See log for recovery steps.');
  }

  if (daysLeft <= 14) {
    // Warn with increasing urgency
    const urgency = daysLeft <= 3 ? '🚨 URGENT' : '⚠️  WARNING';
    log(`${urgency}: LinkedIn access token expires in ${daysLeft} day(s)!`);
    log(`${urgency}: Scheduled posts WILL STOP publishing after expiry.`);
    logRecoverySteps();
  }

  return tokens.access_token;
}

/**
 * Exchange a refresh_token for a fresh access_token via LinkedIn OAuth.
 */
async function refreshTokenGrant(clientId, clientSecret, refreshToken) {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    log(`❌ Token refresh failed (${res.status}): ${text}`);
    log('The refresh token may have expired (~365 days after last login).');
    logGitHubRecoverySteps();
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  log('✅ Access token refreshed successfully via refresh_token');
  return data.access_token;
}

/**
 * Print exact recovery steps for local token expiry.
 */
function logRecoverySteps() {
  log('─────────────────────────────────────────────────────');
  log('HOW TO FIX — follow these steps:');
  log('');
  log('STEP 1 — Re-authenticate locally:');
  log('  cd ~/linkedin-social-mcp && npm run auth');
  log('  (A browser window will open — log in and approve permissions)');
  log('');
  log('STEP 2 — Update GitHub Actions secret (for cloud scheduler):');
  log('  a) Get your new refresh token:');
  log('     cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token');
  log('  b) Go to your GitHub repo:');
  log('     https://github.com/YOUR_REPO/settings/secrets/actions');
  log('  c) Update secret "LINKEDIN_REFRESH_TOKEN" with the new value');
  log('     (also update LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET if not set)');
  log('');
  log('STEP 3 — Verify the local scheduler is running:');
  log('  launchctl list | grep linkedin');
  log('  tail -20 ~/.linkedin-social-mcp/scheduler.log');
  log('─────────────────────────────────────────────────────');
}

/**
 * Print recovery steps specific to GitHub Actions refresh token failure.
 */
function logGitHubRecoverySteps() {
  log('─────────────────────────────────────────────────────');
  log('GITHUB ACTIONS RECOVERY — follow these steps:');
  log('');
  log('STEP 1 — Re-authenticate locally to get a new refresh token:');
  log('  cd ~/linkedin-social-mcp && npm run auth');
  log('');
  log('STEP 2 — Update ALL three GitHub secrets:');
  log('  Go to: https://github.com/YOUR_REPO/settings/secrets/actions');
  log('  Update: LINKEDIN_REFRESH_TOKEN');
  log('    → cat ~/.linkedin-social-mcp/tokens.json | grep refresh_token');
  log('  Update: LINKEDIN_CLIENT_ID');
  log('    → cat ~/linkedin-social-mcp/.env | grep CLIENT_ID');
  log('  Update: LINKEDIN_CLIENT_SECRET');
  log('    → cat ~/linkedin-social-mcp/.env | grep CLIENT_SECRET');
  log('');
  log('STEP 3 — Test manually:');
  log('  Go to your repo → Actions → LinkedIn Post Scheduler → Run workflow');
  log('─────────────────────────────────────────────────────');
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
    token = await getAccessToken();
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
