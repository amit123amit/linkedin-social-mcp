import express from 'express';
import open from 'open';
import * as crypto from 'crypto';
import type { LinkedInTokens } from '../lib/types.js';
import { TokenStore } from './token-store.js';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

// All scopes required by the "Share on LinkedIn" product
export const REQUIRED_SCOPES = [
  'r_basicprofile',
  'r_1st_connections_size',
  'w_member_social',
  'r_organization_social',
  'w_organization_social',
  'rw_organization_admin',
  'r_organization_admin',
];

export class LinkedInOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tokenStore: TokenStore;

  constructor(tokenStore: TokenStore) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in environment.\n' +
        'Copy .env.example to .env and fill in your credentials.'
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/callback';
    this.tokenStore = tokenStore;
  }

  async authenticate(): Promise<LinkedInTokens> {
    return new Promise((resolve, reject) => {
      const app = express();
      const state = crypto.randomBytes(16).toString('hex');
      const port = parseInt(new URL(this.redirectUri).port || '3000');

      const server = app.listen(port, () => {
        console.log(`\nOAuth callback server listening on port ${port}`);
      });

      const timeout = setTimeout(() => {
        server.close();
        reject(new Error('OAuth flow timed out after 5 minutes. Run `npm run auth` to try again.'));
      }, 5 * 60 * 1000);

      app.get('/callback', async (req, res) => {
        const { code, state: returnedState, error, error_description } = req.query;

        if (error) {
          const msg = `LinkedIn OAuth error: ${error} — ${error_description}`;
          res.status(400).send(`<h2>Authentication Failed</h2><p>${msg}</p>`);
          clearTimeout(timeout);
          server.close();
          return reject(new Error(msg));
        }

        if (returnedState !== state) {
          const msg = 'State mismatch — possible CSRF attack. Please try again.';
          res.status(400).send(`<h2>Authentication Failed</h2><p>${msg}</p>`);
          clearTimeout(timeout);
          server.close();
          return reject(new Error(msg));
        }

        if (!code || typeof code !== 'string') {
          const msg = 'No authorization code received from LinkedIn.';
          res.status(400).send(`<h2>Authentication Failed</h2><p>${msg}</p>`);
          clearTimeout(timeout);
          server.close();
          return reject(new Error(msg));
        }

        try {
          const tokens = await this.exchangeCode(code);
          await this.tokenStore.saveTokens(tokens);

          res.send(`
            <h2 style="font-family:sans-serif;color:#0a66c2">✅ LinkedIn Authentication Successful!</h2>
            <p style="font-family:sans-serif">You can close this tab and return to Claude.</p>
            <p style="font-family:sans-serif;color:#888;font-size:12px">Scopes granted: ${tokens.scope}</p>
          `);

          clearTimeout(timeout);
          server.close();
          resolve(tokens);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          res.status(500).send(`<h2>Authentication Failed</h2><p>${msg}</p>`);
          clearTimeout(timeout);
          server.close();
          reject(err);
        }
      });

      const authUrl = new URL(LINKEDIN_AUTH_URL);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('scope', REQUIRED_SCOPES.join(' '));

      console.log('\nOpening LinkedIn authorization in your browser...');
      console.log(`If it doesn't open automatically, visit:\n${authUrl.toString()}\n`);
      open(authUrl.toString());
    });
  }

  private async exchangeCode(code: string): Promise<LinkedInTokens> {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${body}`);
    }

    const tokens = await response.json() as Omit<LinkedInTokens, 'expires_at'>;
    return {
      ...tokens,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    };
  }
}
