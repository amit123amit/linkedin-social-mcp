import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { LinkedInApiClient } from '../lib/linkedin-api.js';

// ─── Tool Definitions ──────────────────────────────────────────────────────

export const getMyProfileTool: Tool = {
  name: 'get_my_profile',
  description: 'Retrieve the authenticated member\'s LinkedIn profile (name, headline, profile picture, vanity URL). Requires r_basicprofile scope.',
  inputSchema: { type: 'object', properties: {} },
};

export const getConnectionCountTool: Tool = {
  name: 'get_connection_count',
  description: 'Get the number of 1st-degree connections for the authenticated member. Requires r_1st_connections_size scope.',
  inputSchema: {
    type: 'object',
    properties: {
      person_urn: {
        type: 'string',
        description: 'Member URN in the format urn:li:person:{id}. Use get_my_profile first to retrieve your id.',
      },
    },
    required: ['person_urn'],
  },
};

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function handleGetMyProfile(client: LinkedInApiClient, _args: unknown) {
  const profile = await client.getMyProfile();

  const locale = profile.firstName.preferredLocale;
  const key = `${locale.language}_${locale.country}`;
  const firstName = profile.firstName.localized[key] ?? Object.values(profile.firstName.localized)[0] ?? '';
  const lastName = profile.lastName.localized[key] ?? Object.values(profile.lastName.localized)[0] ?? '';
  const headline = profile.headline?.localized[key] ?? Object.values(profile.headline?.localized ?? {})[0] ?? '';

  return {
    id: profile.id,
    memberUrn: `urn:li:person:${profile.id}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    headline,
    vanityName: profile.vanityName,
    profileUrl: profile.vanityName ? `https://www.linkedin.com/in/${profile.vanityName}` : undefined,
  };
}

export async function handleGetConnectionCount(client: LinkedInApiClient, args: unknown) {
  const { person_urn } = args as { person_urn: string };
  const result = await client.getConnectionCount(person_urn);
  return {
    personUrn: person_urn,
    firstDegreeConnectionCount: result.firstDegreeSize,
  };
}
