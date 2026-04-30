import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { LinkedInApiClient } from '../lib/linkedin-api.js';
import { ScheduledPostStore } from '../auth/scheduled-post-store.js';

// ─── Tool Definitions ──────────────────────────────────────────────────────

export const previewPostTool: Tool = {
  name: 'preview_post',
  description: 'Preview how a LinkedIn post will look before publishing — validates length, extracts hashtags and mentions, detects URLs, and shows a formatted preview. No API call made; purely local.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The post text you want to preview.',
      },
      article_url: {
        type: 'string',
        description: 'Optional URL to be shared with the post.',
      },
      author_name: {
        type: 'string',
        description: 'Optional author name to show in the preview (e.g. your name or org name).',
      },
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'CONNECTIONS', 'LOGGED_IN'],
        description: 'Intended audience. Defaults to PUBLIC.',
      },
    },
    required: ['text'],
  },
};

export const schedulePostTool: Tool = {
  name: 'schedule_post',
  description: 'Schedule a LinkedIn post to be published at a future date/time on behalf of the authenticated member. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      author_urn: {
        type: 'string',
        description: 'Member URN: urn:li:person:{id}. Use get_my_profile to get your id.',
      },
      text: {
        type: 'string',
        description: 'Post body text (max 3000 characters).',
      },
      scheduled_time: {
        type: 'string',
        description: 'ISO 8601 datetime string for when to publish, e.g. "2026-05-10T09:00:00Z". Must be at least 10 minutes in the future.',
      },
      article_url: {
        type: 'string',
        description: 'Optional URL to share with the post.',
      },
      article_title: { type: 'string', description: 'Optional title for the link preview.' },
      article_description: { type: 'string', description: 'Optional description for the link preview.' },
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'CONNECTIONS', 'LOGGED_IN'],
        description: 'Audience for the post. Defaults to PUBLIC.',
      },
    },
    required: ['author_urn', 'text', 'scheduled_time'],
  },
};

export const scheduleOrgPostTool: Tool = {
  name: 'schedule_org_post',
  description: 'Schedule a LinkedIn post on behalf of an organization page to be published at a future date/time. Requires w_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_urn: {
        type: 'string',
        description: 'Organization URN: urn:li:organization:{id}.',
      },
      text: {
        type: 'string',
        description: 'Post body text (max 3000 characters).',
      },
      scheduled_time: {
        type: 'string',
        description: 'ISO 8601 datetime string for when to publish, e.g. "2026-05-10T09:00:00Z". Must be at least 10 minutes in the future.',
      },
      article_url: { type: 'string', description: 'Optional URL to share.' },
      article_title: { type: 'string', description: 'Optional link preview title.' },
      article_description: { type: 'string', description: 'Optional link preview description.' },
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'LOGGED_IN'],
        description: 'Audience. Defaults to PUBLIC.',
      },
    },
    required: ['org_urn', 'text', 'scheduled_time'],
  },
};

export const listScheduledPostsTool: Tool = {
  name: 'list_scheduled_posts',
  description: 'List all scheduled (draft) posts for a member or organization page that have not yet been published. Requires w_member_social or w_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      author_urn: {
        type: 'string',
        description: 'URN of the member or organization whose scheduled posts to list. E.g. urn:li:person:{id} or urn:li:organization:{id}.',
      },
      count: { type: 'number', description: 'Max results to return. Defaults to 20.' },
      start: { type: 'number', description: 'Pagination offset. Defaults to 0.' },
    },
    required: ['author_urn'],
  },
};

export const cancelScheduledPostTool: Tool = {
  name: 'cancel_scheduled_post',
  description: 'Cancel and delete a scheduled (draft) LinkedIn post before it is published. Requires w_member_social or w_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: {
        type: 'string',
        description: 'URN of the scheduled post to cancel, e.g. urn:li:ugcPost:1234567890.',
      },
    },
    required: ['post_urn'],
  },
};

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function handlePreviewPost(_client: LinkedInApiClient, args: unknown) {
  const { text, article_url, author_name, visibility = 'PUBLIC' } = args as {
    text: string;
    article_url?: string;
    author_name?: string;
    visibility?: string;
  };

  const charCount = text.length;
  const maxChars = 3000;
  const remaining = maxChars - charCount;

  const hashtags = [...text.matchAll(/#[\wÀ-ɏ]+/g)].map(m => m[0]);
  const mentions = [...text.matchAll(/@[\w\s]+/g)].map(m => m[0].trim());
  const urlsInText = [...text.matchAll(/https?:\/\/[^\s]+/g)].map(m => m[0]);

  const wordCount = text.trim().split(/\s+/).length;
  const avgReadingWPM = 200;
  const readingTimeSecs = Math.ceil((wordCount / avgReadingWPM) * 60);

  const warnings: string[] = [];
  if (charCount > maxChars) warnings.push(`❌ Post exceeds max length by ${-remaining} characters.`);
  if (charCount > 700) warnings.push(`⚠️  Posts over 700 chars get a "see more" truncation on mobile.`);
  if (hashtags.length > 5) warnings.push(`⚠️  More than 5 hashtags may reduce organic reach.`);
  if (hashtags.length === 0) warnings.push(`💡 Consider adding 2-3 relevant hashtags to improve discoverability.`);
  if (urlsInText.length > 0 && !article_url) warnings.push(`💡 URLs in post text may reduce reach. Consider using the article_url parameter instead.`);

  const divider = '─'.repeat(50);
  const previewLines = [
    divider,
    `👤 ${author_name ?? 'You'} • ${visibility === 'PUBLIC' ? '🌍 Public' : visibility === 'CONNECTIONS' ? '👥 Connections only' : '🔒 LinkedIn members'}`,
    divider,
    text,
    ...(article_url ? [`\n🔗 ${article_url}`] : []),
    divider,
  ];

  return {
    preview: previewLines.join('\n'),
    analysis: {
      characterCount: charCount,
      charactersRemaining: remaining,
      wordCount,
      estimatedReadingTime: `${readingTimeSecs} seconds`,
      hashtags,
      mentions,
      urlsInText,
      articleUrl: article_url ?? null,
      visibility,
    },
    warnings: warnings.length > 0 ? warnings : ['✅ Post looks good to publish!'],
    readyToPublish: charCount <= maxChars,
  };
}

export async function handleSchedulePost(client: LinkedInApiClient, args: unknown, store?: ScheduledPostStore) {
  const { author_urn, text, scheduled_time, article_url, article_title, article_description, visibility } = args as {
    author_urn: string;
    text: string;
    scheduled_time: string;
    article_url?: string;
    article_title?: string;
    article_description?: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN';
  };

  const scheduledMs = new Date(scheduled_time).getTime();
  const nowMs = Date.now();
  const tenMinutesMs = 10 * 60 * 1000;

  if (isNaN(scheduledMs)) {
    throw new Error(`Invalid scheduled_time: "${scheduled_time}". Use ISO 8601 format, e.g. "2026-05-10T09:00:00Z".`);
  }
  if (scheduledMs < nowMs + tenMinutesMs) {
    throw new Error(`scheduled_time must be at least 10 minutes in the future. Provided: ${scheduled_time}`);
  }

  const result = await client.createScheduledPost({
    authorUrn: author_urn,
    text,
    scheduledPublishTime: scheduledMs,
    articleUrl: article_url,
    articleTitle: article_title,
    articleDescription: article_description,
    visibility,
  });

  const scheduledFor = new Date(scheduledMs).toISOString();
  const scheduledForLocal = new Date(scheduledMs).toLocaleString();

  // Save to local store
  store?.addPost({
    postUrn: result.id,
    authorUrn: author_urn,
    text,
    visibility: visibility ?? 'PUBLIC',
    scheduledFor,
    scheduledForLocal,
    createdAt: new Date().toISOString(),
    status: 'SCHEDULED',
    articleUrl: article_url,
    type: 'personal',
  });

  return {
    success: true,
    postUrn: result.id,
    scheduledFor,
    scheduledForLocal,
    authorUrn: author_urn,
    status: 'SCHEDULED',
    localTracking: '✅ Saved to ~/.linkedin-social-mcp/scheduled-posts.json',
  };
}

export async function handleScheduleOrgPost(client: LinkedInApiClient, args: unknown, store?: ScheduledPostStore) {
  const { org_urn, text, scheduled_time, article_url, article_title, article_description, visibility, org_name } = args as {
    org_urn: string;
    text: string;
    scheduled_time: string;
    article_url?: string;
    article_title?: string;
    article_description?: string;
    visibility?: 'PUBLIC' | 'LOGGED_IN';
    org_name?: string;
  };

  const scheduledMs = new Date(scheduled_time).getTime();
  const nowMs = Date.now();

  if (isNaN(scheduledMs)) {
    throw new Error(`Invalid scheduled_time: "${scheduled_time}". Use ISO 8601 format, e.g. "2026-05-10T09:00:00Z".`);
  }
  if (scheduledMs < nowMs + 10 * 60 * 1000) {
    throw new Error(`scheduled_time must be at least 10 minutes in the future. Provided: ${scheduled_time}`);
  }

  const result = await client.createScheduledPost({
    authorUrn: org_urn,
    text,
    scheduledPublishTime: scheduledMs,
    articleUrl: article_url,
    articleTitle: article_title,
    articleDescription: article_description,
    visibility,
  });

  const scheduledFor = new Date(scheduledMs).toISOString();
  const scheduledForLocal = new Date(scheduledMs).toLocaleString();

  // Save to local store
  store?.addPost({
    postUrn: result.id,
    authorUrn: org_urn,
    text,
    visibility: visibility ?? 'PUBLIC',
    scheduledFor,
    scheduledForLocal,
    createdAt: new Date().toISOString(),
    status: 'SCHEDULED',
    articleUrl: article_url,
    type: 'org',
    orgName: org_name,
  });

  return {
    success: true,
    postUrn: result.id,
    scheduledFor,
    scheduledForLocal,
    orgUrn: org_urn,
    status: 'SCHEDULED',
    localTracking: '✅ Saved to ~/.linkedin-social-mcp/scheduled-posts.json',
  };
}

export async function handleListScheduledPosts(client: LinkedInApiClient, args: unknown, store?: ScheduledPostStore) {
  const { author_urn, count = 20, start = 0 } = args as {
    author_urn: string;
    count?: number;
    start?: number;
  };

  const isOrg = author_urn.includes('organization');

  // For personal profiles: always use local store (no r_member_social scope available)
  if (!isOrg) {
    if (!store) throw new Error('Local store not available.');

    store.syncStatuses(); // auto-expire passed scheduled posts
    const posts = store.getAll(author_urn).slice(start, start + count);
    const scheduled = posts.filter(p => p.status === 'SCHEDULED');
    const published = posts.filter(p => p.status === 'PUBLISHED');
    const cancelled = posts.filter(p => p.status === 'CANCELLED');

    return {
      source: 'local-store',
      authorUrn: author_urn,
      note: 'LinkedIn API does not allow reading personal posts (requires restricted r_member_social scope). Showing locally tracked posts.',
      summary: {
        total: posts.length,
        scheduled: scheduled.length,
        published: published.length,
        cancelled: cancelled.length,
      },
      scheduledPosts: scheduled.map(p => ({
        postUrn: p.postUrn,
        text: p.text.length > 120 ? p.text.slice(0, 120) + '…' : p.text,
        visibility: p.visibility,
        scheduledFor: p.scheduledFor,
        scheduledForLocal: p.scheduledForLocal,
        createdAt: p.createdAt,
        status: p.status,
        type: p.type,
      })),
      allPosts: posts.map(p => ({
        postUrn: p.postUrn,
        text: p.text.length > 80 ? p.text.slice(0, 80) + '…' : p.text,
        status: p.status,
        scheduledFor: p.scheduledFor,
        scheduledForLocal: p.scheduledForLocal,
        type: p.type,
      })),
    };
  }

  // For org pages: try the API, fall back to local store
  try {
    const result = await client.getScheduledPosts(author_urn, count, start);
    const apiPosts = result.elements.map(p => {
      const content = p.specificContent?.['com.linkedin.ugc.ShareContent'];
      return {
        postUrn: p.id,
        text: content?.shareCommentary?.text,
        scheduledPublishTime: p.scheduledPublishTime
          ? new Date(p.scheduledPublishTime).toISOString()
          : null,
        lifecycleState: p.lifecycleState,
        mediaCategory: content?.shareMediaCategory,
      };
    });

    // Merge with local store records
    const localPosts = store?.getAll(author_urn) ?? [];
    return {
      source: 'api+local-store',
      authorUrn: author_urn,
      total: apiPosts.length,
      apiPosts,
      localTrackedPosts: localPosts.map(p => ({
        postUrn: p.postUrn,
        text: p.text.length > 80 ? p.text.slice(0, 80) + '…' : p.text,
        status: p.status,
        scheduledFor: p.scheduledFor,
        scheduledForLocal: p.scheduledForLocal,
      })),
    };
  } catch {
    // API failed — fall back to local store only
    if (!store) throw new Error('Both API and local store unavailable.');
    store.syncStatuses();
    const posts = store.getAll(author_urn).slice(start, start + count);
    return {
      source: 'local-store-fallback',
      authorUrn: author_urn,
      total: posts.length,
      posts: posts.map(p => ({
        postUrn: p.postUrn,
        text: p.text.length > 80 ? p.text.slice(0, 80) + '…' : p.text,
        status: p.status,
        scheduledFor: p.scheduledForLocal,
        type: p.type,
        orgName: p.orgName,
      })),
    };
  }
}

export async function handleCancelScheduledPost(client: LinkedInApiClient, args: unknown, store?: ScheduledPostStore) {
  const { post_urn } = args as { post_urn: string };
  await client.deletePost(post_urn);
  const removedFromStore = store?.cancelPost(post_urn) ?? false;
  return {
    success: true,
    cancelled: post_urn,
    message: 'Scheduled post cancelled and deleted.',
    localStoreUpdated: removedFromStore,
  };
}
