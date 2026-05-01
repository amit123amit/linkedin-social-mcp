import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { LinkedInApiClient } from '../lib/linkedin-api.js';

// ─── Tool Definitions ──────────────────────────────────────────────────────

export const getOrganizationTool: Tool = {
  name: 'get_organization',
  description: 'Retrieve details of a LinkedIn organization page including name, description, website, follower count, and industry. Requires rw_organization_admin scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_id: {
        type: 'string',
        description: 'Numeric organization ID (not the URN). E.g. "12345678".',
      },
    },
    required: ['org_id'],
  },
};

export const updateOrganizationTool: Tool = {
  name: 'update_organization',
  description: 'Update fields on a LinkedIn organization page such as description or website. Requires rw_organization_admin scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_id: { type: 'string', description: 'Numeric organization ID.' },
      description: { type: 'string', description: 'Updated organization description (localized text).' },
      website_url: { type: 'string', description: 'Updated website URL for the organization.' },
    },
    required: ['org_id'],
  },
};

export const listMyPagesTool: Tool = {
  name: 'list_my_pages',
  description:
    'List all LinkedIn organization pages where the authenticated user is an ADMINISTRATOR. ' +
    'Returns each page\'s name, numeric ID, URN, vanity URL, and role. ' +
    'Use this to discover which pages you can post to, schedule on, or pull analytics for. ' +
    'Requires rw_organization_admin scope.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export const getOrganizationAdminsTool: Tool = {
  name: 'get_organization_admins',
  description: 'List all admins and their roles for a LinkedIn organization page. Requires rw_organization_admin scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_urn: {
        type: 'string',
        description: 'Organization URN: urn:li:organization:{id}.',
      },
    },
    required: ['org_urn'],
  },
};

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function handleListMyPages(client: LinkedInApiClient, _args: unknown) {
  const aclResult = await client.getMyAdminPages();

  const pages = await Promise.all(
    aclResult.elements.map(async (acl) => {
      const orgUrn = acl.organization;
      const orgId  = orgUrn.split(':').pop()!;
      try {
        const org = await client.getOrganization(orgId);
        const locale = org.name.preferredLocale;
        const key    = `${locale.language}_${locale.country}`;
        const name   =
          org.localizedName ??
          org.name.localized[key] ??
          (Object.values(org.name.localized)[0] as string | undefined) ??
          '';
        return {
          orgId:     org.id,
          orgUrn,
          name,
          vanityName: org.vanityName,
          pageUrl:    org.vanityName
            ? `https://www.linkedin.com/company/${org.vanityName}`
            : undefined,
          role:  acl.role,
          state: acl.state,
        };
      } catch {
        return {
          orgId,
          orgUrn,
          role:  acl.role,
          state: acl.state,
          error: 'Could not fetch page details',
        };
      }
    }),
  );

  return {
    total: aclResult.paging?.total ?? pages.length,
    pages,
  };
}

export async function handleGetOrganization(client: LinkedInApiClient, args: unknown) {
  const { org_id } = args as { org_id: string };
  const org = await client.getOrganization(org_id);

  const locale = org.name.preferredLocale;
  const key = `${locale.language}_${locale.country}`;
  const name = org.localizedName ?? org.name.localized[key] ?? Object.values(org.name.localized)[0] ?? '';
  const description =
    org.description?.localized[key] ??
    Object.values(org.description?.localized ?? {})[0] ??
    '';

  return {
    id: org.id,
    orgUrn: `urn:li:organization:${org.id}`,
    name,
    description,
    vanityName: org.vanityName,
    websiteUrl: org.websiteUrl,
    followersCount: org.followersCount,
    specialties: org.specialties,
    foundedOn: org.foundedOn,
    staffCountRange: org.staffCountRange,
    industries: org.industries,
    pageUrl: org.vanityName ? `https://www.linkedin.com/company/${org.vanityName}` : undefined,
  };
}

export async function handleUpdateOrganization(client: LinkedInApiClient, args: unknown) {
  const { org_id, description, website_url } = args as {
    org_id: string;
    description?: string;
    website_url?: string;
  };

  const patch: Record<string, unknown> = {};
  if (description !== undefined) {
    patch['description'] = { localized: { en_US: description }, preferredLocale: { country: 'US', language: 'en' } };
  }
  if (website_url !== undefined) {
    patch['websiteUrl'] = website_url;
  }

  if (Object.keys(patch).length === 0) {
    return { success: false, message: 'No fields provided to update.' };
  }

  await client.updateOrganization(org_id, patch);
  return { success: true, updated: Object.keys(patch), orgId: org_id };
}

export async function handleGetOrganizationAdmins(client: LinkedInApiClient, args: unknown) {
  const { org_urn } = args as { org_urn: string };
  const result = await client.getOrganizationAdmins(org_urn);
  return {
    orgUrn: org_urn,
    total: result.paging?.total ?? result.elements.length,
    admins: result.elements.map(acl => ({
      memberUrn: acl.roleAssignee,
      role: acl.role,
      state: acl.state,
    })),
  };
}
