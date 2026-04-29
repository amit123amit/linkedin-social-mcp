import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { LinkedInApiClient } from '../lib/linkedin-api.js';

// ─── Tool Definitions ──────────────────────────────────────────────────────

export const createOrgTextPostTool: Tool = {
  name: 'create_org_text_post',
  description: 'Create a text post on LinkedIn on behalf of an organization page. Requires w_organization_social scope.',
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
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'LOGGED_IN'],
        description: 'Audience for the post. Defaults to PUBLIC.',
      },
    },
    required: ['org_urn', 'text'],
  },
};

export const createOrgLinkPostTool: Tool = {
  name: 'create_org_link_post',
  description: 'Create an article/link post on LinkedIn on behalf of an organization page. Requires w_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_urn: { type: 'string', description: 'Organization URN: urn:li:organization:{id}.' },
      text: { type: 'string', description: 'Commentary text for the post.' },
      article_url: { type: 'string', description: 'URL to share.' },
      article_title: { type: 'string', description: 'Optional title override for the link preview.' },
      article_description: { type: 'string', description: 'Optional description override for the link preview.' },
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'LOGGED_IN'],
        description: 'Audience. Defaults to PUBLIC.',
      },
    },
    required: ['org_urn', 'text', 'article_url'],
  },
};

export const deleteOrgPostTool: Tool = {
  name: 'delete_org_post',
  description: 'Delete a post made by an organization page. Requires w_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post to delete.' },
    },
    required: ['post_urn'],
  },
};

export const getOrgPostsTool: Tool = {
  name: 'get_org_posts',
  description: 'Retrieve recent posts published by an organization page. Requires r_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      org_urn: { type: 'string', description: 'Organization URN: urn:li:organization:{id}.' },
      count: { type: 'number', description: 'Number of posts to return (max 100). Defaults to 10.' },
      start: { type: 'number', description: 'Pagination offset. Defaults to 0.' },
    },
    required: ['org_urn'],
  },
};

export const createOrgCommentTool: Tool = {
  name: 'create_org_comment',
  description: 'Post a comment on behalf of an organization page. Requires w_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post to comment on.' },
      org_urn: { type: 'string', description: 'Organization URN acting as commenter: urn:li:organization:{id}.' },
      text: { type: 'string', description: 'Comment text.' },
    },
    required: ['post_urn', 'org_urn', 'text'],
  },
};

export const getPostCommentsTool: Tool = {
  name: 'get_post_comments',
  description: 'Retrieve comments on a LinkedIn post. Requires r_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post.' },
      count: { type: 'number', description: 'Number of comments to return (max 100). Defaults to 10.' },
      start: { type: 'number', description: 'Pagination offset. Defaults to 0.' },
    },
    required: ['post_urn'],
  },
};

export const getPostReactionsTool: Tool = {
  name: 'get_post_reactions',
  description: 'Retrieve reactions (likes) on a LinkedIn post. Requires r_organization_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post.' },
      count: { type: 'number', description: 'Number of reactions to return (max 100). Defaults to 10.' },
      start: { type: 'number', description: 'Pagination offset. Defaults to 0.' },
    },
    required: ['post_urn'],
  },
};

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function handleCreateOrgTextPost(client: LinkedInApiClient, args: unknown) {
  const { org_urn, text, visibility } = args as {
    org_urn: string;
    text: string;
    visibility?: 'PUBLIC' | 'LOGGED_IN';
  };
  const result = await client.createPost({ authorUrn: org_urn, text, visibility });
  return { success: true, postUrn: result.id, postUrl: `https://www.linkedin.com/feed/update/${result.id}/` };
}

export async function handleCreateOrgLinkPost(client: LinkedInApiClient, args: unknown) {
  const { org_urn, text, article_url, article_title, article_description, visibility } = args as {
    org_urn: string;
    text: string;
    article_url: string;
    article_title?: string;
    article_description?: string;
    visibility?: 'PUBLIC' | 'LOGGED_IN';
  };
  const result = await client.createPost({
    authorUrn: org_urn,
    text,
    articleUrl: article_url,
    articleTitle: article_title,
    articleDescription: article_description,
    visibility,
  });
  return { success: true, postUrn: result.id, postUrl: `https://www.linkedin.com/feed/update/${result.id}/` };
}

export async function handleDeleteOrgPost(client: LinkedInApiClient, args: unknown) {
  const { post_urn } = args as { post_urn: string };
  await client.deletePost(post_urn);
  return { success: true, deleted: post_urn };
}

export async function handleGetOrgPosts(client: LinkedInApiClient, args: unknown) {
  const { org_urn, count = 10, start = 0 } = args as { org_urn: string; count?: number; start?: number };
  const result = await client.getOrgPosts(org_urn, count, start);
  return {
    orgUrn: org_urn,
    total: result.paging?.total ?? result.elements.length,
    posts: result.elements.map(p => ({
      postUrn: p.id,
      lifecycleState: p.lifecycleState,
      text: p.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text,
      mediaCategory: p.specificContent?.['com.linkedin.ugc.ShareContent']?.shareMediaCategory,
      createdAt: p.created?.time ? new Date(p.created.time).toISOString() : undefined,
      statistics: p.statistics,
    })),
  };
}

export async function handleCreateOrgComment(client: LinkedInApiClient, args: unknown) {
  const { post_urn, org_urn, text } = args as { post_urn: string; org_urn: string; text: string };
  const result = await client.createComment({ postUrn: post_urn, actorUrn: org_urn, text });
  return { success: true, commentUrn: result.id };
}

export async function handleGetPostComments(client: LinkedInApiClient, args: unknown) {
  const { post_urn, count = 10, start = 0 } = args as { post_urn: string; count?: number; start?: number };
  const result = await client.getPostComments(post_urn, count, start);
  return {
    postUrn: post_urn,
    total: result.paging?.total ?? result.elements.length,
    comments: result.elements.map(c => ({
      commentUrn: c.id,
      actor: c.actor,
      text: c.message?.text,
      createdAt: c.created?.time ? new Date(c.created.time).toISOString() : undefined,
    })),
  };
}

export async function handleGetPostReactions(client: LinkedInApiClient, args: unknown) {
  const { post_urn, count = 10, start = 0 } = args as { post_urn: string; count?: number; start?: number };
  const result = await client.getPostReactions(post_urn, count, start);
  return {
    postUrn: post_urn,
    total: result.paging?.total ?? result.elements.length,
    reactions: result.elements,
  };
}
