import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { LinkedInApiClient } from '../lib/linkedin-api.js';

// ─── Tool Definitions ──────────────────────────────────────────────────────

export const createTextPostTool: Tool = {
  name: 'create_text_post',
  description: 'Create a text post on LinkedIn on behalf of the authenticated member. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      author_urn: {
        type: 'string',
        description: 'Member URN: urn:li:person:{id}. Get it from get_my_profile.',
      },
      text: {
        type: 'string',
        description: 'Post body text (max 3000 characters).',
      },
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'CONNECTIONS', 'LOGGED_IN'],
        description: 'Audience for the post. Defaults to PUBLIC.',
      },
    },
    required: ['author_urn', 'text'],
  },
};

export const createLinkPostTool: Tool = {
  name: 'create_link_post',
  description: 'Create a LinkedIn post with an article/URL link on behalf of the member. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      author_urn: { type: 'string', description: 'Member URN: urn:li:person:{id}.' },
      text: { type: 'string', description: 'Commentary text for the post.' },
      article_url: { type: 'string', description: 'URL of the article or link to share.' },
      article_title: { type: 'string', description: 'Optional title override for the link preview.' },
      article_description: { type: 'string', description: 'Optional description override for the link preview.' },
      visibility: {
        type: 'string',
        enum: ['PUBLIC', 'CONNECTIONS', 'LOGGED_IN'],
        description: 'Audience for the post. Defaults to PUBLIC.',
      },
    },
    required: ['author_urn', 'text', 'article_url'],
  },
};

export const deletePostTool: Tool = {
  name: 'delete_post',
  description: 'Delete a LinkedIn post made by the authenticated member. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: {
        type: 'string',
        description: 'URN of the post to delete, e.g. urn:li:ugcPost:1234567890.',
      },
    },
    required: ['post_urn'],
  },
};

export const createCommentTool: Tool = {
  name: 'create_comment',
  description: 'Add a comment to a LinkedIn post on behalf of the authenticated member. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post to comment on.' },
      actor_urn: { type: 'string', description: 'Member URN posting the comment: urn:li:person:{id}.' },
      text: { type: 'string', description: 'Comment text.' },
    },
    required: ['post_urn', 'actor_urn', 'text'],
  },
};

export const deleteCommentTool: Tool = {
  name: 'delete_comment',
  description: 'Delete a comment made by the authenticated member on a LinkedIn post. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the parent post.' },
      comment_urn: { type: 'string', description: 'URN of the comment to delete.' },
    },
    required: ['post_urn', 'comment_urn'],
  },
};

export const reactToPostTool: Tool = {
  name: 'react_to_post',
  description: 'Like a LinkedIn post on behalf of the authenticated member. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post to like.' },
      actor_urn: { type: 'string', description: 'Member URN reacting: urn:li:person:{id}.' },
    },
    required: ['post_urn', 'actor_urn'],
  },
};

export const removeReactionTool: Tool = {
  name: 'remove_reaction',
  description: 'Remove the authenticated member\'s like from a LinkedIn post. Requires w_member_social scope.',
  inputSchema: {
    type: 'object',
    properties: {
      post_urn: { type: 'string', description: 'URN of the post.' },
      actor_urn: { type: 'string', description: 'Member URN whose reaction to remove: urn:li:person:{id}.' },
    },
    required: ['post_urn', 'actor_urn'],
  },
};

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function handleCreateTextPost(client: LinkedInApiClient, args: unknown) {
  const { author_urn, text, visibility } = args as {
    author_urn: string;
    text: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN';
  };
  const result = await client.createPost({ authorUrn: author_urn, text, visibility });
  return { success: true, postUrn: result.id, postUrl: `https://www.linkedin.com/feed/update/${result.id}/` };
}

export async function handleCreateLinkPost(client: LinkedInApiClient, args: unknown) {
  const { author_urn, text, article_url, article_title, article_description, visibility } = args as {
    author_urn: string;
    text: string;
    article_url: string;
    article_title?: string;
    article_description?: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN';
  };
  const result = await client.createPost({
    authorUrn: author_urn,
    text,
    articleUrl: article_url,
    articleTitle: article_title,
    articleDescription: article_description,
    visibility,
  });
  return { success: true, postUrn: result.id, postUrl: `https://www.linkedin.com/feed/update/${result.id}/` };
}

export async function handleDeletePost(client: LinkedInApiClient, args: unknown) {
  const { post_urn } = args as { post_urn: string };
  await client.deletePost(post_urn);
  return { success: true, deleted: post_urn };
}

export async function handleCreateComment(client: LinkedInApiClient, args: unknown) {
  const { post_urn, actor_urn, text } = args as { post_urn: string; actor_urn: string; text: string };
  const result = await client.createComment({ postUrn: post_urn, actorUrn: actor_urn, text });
  return { success: true, commentUrn: result.id };
}

export async function handleDeleteComment(client: LinkedInApiClient, args: unknown) {
  const { post_urn, comment_urn } = args as { post_urn: string; comment_urn: string };
  await client.deleteComment(post_urn, comment_urn);
  return { success: true, deleted: comment_urn };
}

export async function handleReactToPost(client: LinkedInApiClient, args: unknown) {
  const { post_urn, actor_urn } = args as { post_urn: string; actor_urn: string };
  await client.reactToPost(post_urn, actor_urn);
  return { success: true, liked: post_urn };
}

export async function handleRemoveReaction(client: LinkedInApiClient, args: unknown) {
  const { post_urn, actor_urn } = args as { post_urn: string; actor_urn: string };
  await client.removeReaction(post_urn, actor_urn);
  return { success: true, unliked: post_urn };
}
