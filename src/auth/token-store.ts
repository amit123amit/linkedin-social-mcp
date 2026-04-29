import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { LinkedInTokens } from '../lib/types.js';

const DEFAULT_TOKEN_DIR = path.join(os.homedir(), '.linkedin-social-mcp');
const DEFAULT_TOKEN_PATH = path.join(DEFAULT_TOKEN_DIR, 'tokens.json');

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

export class TokenStore {
  private tokenPath: string;
  private tokens: LinkedInTokens | null = null;

  constructor(tokenPath?: string) {
    this.tokenPath = tokenPath || process.env.TOKEN_STORAGE_PATH || DEFAULT_TOKEN_PATH;
    this.ensureDirectory();
    this.loadFromDisk();
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.tokenPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const raw = fs.readFileSync(this.tokenPath, 'utf-8');
        this.tokens = JSON.parse(raw) as LinkedInTokens;
      }
    } catch {
      this.tokens = null;
    }
  }

  async saveTokens(tokens: LinkedInTokens): Promise<void> {
    this.tokens = tokens;
    fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) return null;

    const now = Math.floor(Date.now() / 1000);
    const bufferSecs = 300;

    if (this.tokens.expires_at <= now + bufferSecs) {
      if (this.tokens.refresh_token) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) return this.tokens!.access_token;
      }
      return null;
    }

    return this.tokens.access_token;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.tokens?.refresh_token) return false;

    try {
      const response = await fetch(LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      });

      if (!response.ok) return false;

      const refreshed = await response.json() as Omit<LinkedInTokens, 'expires_at'>;
      await this.saveTokens({
        ...refreshed,
        expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      });
      return true;
    } catch {
      return false;
    }
  }

  async hasValidToken(): Promise<boolean> {
    return (await this.getAccessToken()) !== null;
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
    if (fs.existsSync(this.tokenPath)) {
      fs.unlinkSync(this.tokenPath);
    }
  }

  getTokenInfo(): { expiresAt: Date; isExpired: boolean; expiresInMinutes: number; scopes: string } | null {
    if (!this.tokens) return null;
    const expiresAt = new Date(this.tokens.expires_at * 1000);
    const now = new Date();
    const isExpired = expiresAt <= now;
    const expiresInMinutes = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
    return { expiresAt, isExpired, expiresInMinutes, scopes: this.tokens.scope };
  }
}
