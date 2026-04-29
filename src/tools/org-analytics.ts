import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { LinkedInApiClient } from '../lib/linkedin-api.js';

// ─── Tool Definitions ──────────────────────────────────────────────────────

export const getFollowerStatisticsTool: Tool = {
  name: 'get_follower_statistics',
  description: 'Get follower statistics for an organization page — total followers, organic vs paid breakdown, and demographics by region, industry, seniority, and function. Requires r_organization_admin scope.',
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

export const getPageStatisticsTool: Tool = {
  name: 'get_page_statistics',
  description: 'Get visitor/page-view statistics for a LinkedIn organization page — desktop vs mobile views and unique visitors. Requires r_organization_admin scope.',
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

export const getContentStatisticsTool: Tool = {
  name: 'get_content_statistics',
  description: 'Get content/share performance statistics for an organization — impressions, clicks, likes, comments, shares, and engagement rate. Requires r_organization_admin scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_urn: {
        type: 'string',
        description: 'Organization URN: urn:li:organization:{id}.',
      },
      share_urn: {
        type: 'string',
        description: 'Optional: filter stats for a specific post URN. Omit for org-wide totals.',
      },
    },
    required: ['org_urn'],
  },
};

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function handleGetFollowerStatistics(client: LinkedInApiClient, args: unknown) {
  const { org_urn } = args as { org_urn: string };
  const result = await client.getFollowerStatistics(org_urn);

  const stats = result.elements[0];
  if (!stats) return { orgUrn: org_urn, message: 'No follower statistics available.' };

  const totalOrganic = stats.totalFollowerCounts?.organicFollowerCount ?? 0;
  const totalPaid = stats.totalFollowerCounts?.paidFollowerCount ?? 0;

  return {
    orgUrn: org_urn,
    summary: {
      totalFollowers: totalOrganic + totalPaid,
      organicFollowers: totalOrganic,
      paidFollowers: totalPaid,
    },
    byRegion: stats.followerCountsByRegion?.map(r => ({
      region: r.region,
      organic: r.followerCounts.organicFollowerCount,
      paid: r.followerCounts.paidFollowerCount,
    })),
    byIndustry: stats.followerCountsByIndustry?.map(i => ({
      industry: i.industry,
      organic: i.followerCounts.organicFollowerCount,
      paid: i.followerCounts.paidFollowerCount,
    })),
    bySeniority: stats.followerCountsBySeniority?.map(s => ({
      seniority: s.seniority,
      organic: s.followerCounts.organicFollowerCount,
      paid: s.followerCounts.paidFollowerCount,
    })),
    byFunction: stats.followerCountsByFunction?.map(f => ({
      function: f.function,
      organic: f.followerCounts.organicFollowerCount,
      paid: f.followerCounts.paidFollowerCount,
    })),
    byAssociationType: stats.followerCountsByAssociationType?.map(a => ({
      associationType: a.associationType,
      organic: a.followerCounts.organicFollowerCount,
      paid: a.followerCounts.paidFollowerCount,
    })),
  };
}

export async function handleGetPageStatistics(client: LinkedInApiClient, args: unknown) {
  const { org_urn } = args as { org_urn: string };
  const result = await client.getPageStatistics(org_urn);

  const stats = result.elements[0];
  if (!stats) return { orgUrn: org_urn, message: 'No page statistics available.' };

  const views = stats.totalPageStatistics?.views;
  const uniqueViews = stats.totalPageStatistics?.uniqueViews;

  return {
    orgUrn: org_urn,
    totalViews: {
      desktop: views?.allDesktopPageViews?.pageViews ?? 0,
      mobile: views?.allMobilePageViews?.pageViews ?? 0,
      total: (views?.allDesktopPageViews?.pageViews ?? 0) + (views?.allMobilePageViews?.pageViews ?? 0),
    },
    uniqueViews: {
      desktop: uniqueViews?.allDesktopUniquePageViews?.pageViews ?? 0,
      mobile: uniqueViews?.allMobileUniquePageViews?.pageViews ?? 0,
    },
    bySection: {
      overview: {
        desktop: views?.overviewDesktopPageViews?.pageViews ?? 0,
        mobile: views?.overviewMobilePageViews?.pageViews ?? 0,
      },
      jobs: {
        desktop: views?.jobsDesktopPageViews?.pageViews ?? 0,
        mobile: views?.jobsMobilePageViews?.pageViews ?? 0,
      },
    },
  };
}

export async function handleGetContentStatistics(client: LinkedInApiClient, args: unknown) {
  const { org_urn, share_urn } = args as { org_urn: string; share_urn?: string };
  const result = await client.getShareStatistics(org_urn, share_urn);

  const stats = result.elements[0];
  if (!stats) return { orgUrn: org_urn, message: 'No content statistics available.' };

  const totals = stats.totalShareStatistics;
  return {
    orgUrn: org_urn,
    shareUrn: share_urn ?? null,
    impressions: totals?.impressionCount ?? 0,
    uniqueImpressions: totals?.uniqueImpressionsCount ?? 0,
    clicks: totals?.clickCount ?? 0,
    likes: totals?.likeCount ?? 0,
    comments: totals?.commentCount ?? 0,
    shares: totals?.shareCount ?? 0,
    engagementRate: totals?.engagement != null ? `${(totals.engagement * 100).toFixed(2)}%` : null,
  };
}
