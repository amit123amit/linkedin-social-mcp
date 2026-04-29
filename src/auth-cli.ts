#!/usr/bin/env node

import 'dotenv/config';
import { LinkedInOAuth, REQUIRED_SCOPES } from './auth/oauth.js';
import { TokenStore } from './auth/token-store.js';

async function main() {
  const tokenStore = new TokenStore();
  const command = process.argv[2] ?? 'login';

  switch (command) {
    case 'login': {
      console.log('LinkedIn Social MCP — Authentication\n');
      console.log('Required scopes:');
      REQUIRED_SCOPES.forEach(s => console.log(`  • ${s}`));
      console.log();

      const isValid = await tokenStore.hasValidToken();
      if (isValid) {
        const info = tokenStore.getTokenInfo();
        console.log(`Already authenticated.`);
        if (info) {
          console.log(`Token expires: ${info.expiresAt.toLocaleString()} (in ${info.expiresInMinutes} minutes)`);
          console.log(`Scopes: ${info.scopes}`);
        }
        console.log('\nRun `npm run auth logout` to clear and re-authenticate.');
        return;
      }

      const oauth = new LinkedInOAuth(tokenStore);
      const tokens = await oauth.authenticate();
      console.log('\n✅ Authentication successful!');
      console.log(`Scopes granted: ${tokens.scope}`);
      console.log(`Token expires in: ${Math.floor(tokens.expires_in / 3600)} hours`);
      console.log('\nYou can now start the MCP server with: npm start');
      break;
    }

    case 'status': {
      const isValid = await tokenStore.hasValidToken();
      const info = tokenStore.getTokenInfo();
      if (isValid && info) {
        console.log('✅ Authenticated');
        console.log(`Expires: ${info.expiresAt.toLocaleString()} (in ${info.expiresInMinutes} minutes)`);
        console.log(`Scopes: ${info.scopes}`);
      } else if (info?.isExpired) {
        console.log('⚠️  Token expired. Run `npm run auth login` to re-authenticate.');
      } else {
        console.log('❌ Not authenticated. Run `npm run auth` to authenticate.');
      }
      break;
    }

    case 'logout': {
      await tokenStore.clearTokens();
      console.log('✅ Logged out. Tokens cleared.');
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: npm run auth [login|status|logout]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
