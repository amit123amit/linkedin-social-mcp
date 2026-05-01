#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';

import { LinkedInApiClient } from './lib/linkedin-api.js';
import { TokenStore } from './auth/token-store.js';
import { ScheduledPostStore } from './auth/scheduled-post-store.js';

import { getMyProfileTool, getConnectionCountTool, handleGetMyProfile, handleGetConnectionCount } from './tools/profile.js';
import { createTextPostTool, createLinkPostTool, deletePostTool, createCommentTool, deleteCommentTool, reactToPostTool, removeReactionTool, handleCreateTextPost, handleCreateLinkPost, handleDeletePost, handleCreateComment, handleDeleteComment, handleReactToPost, handleRemoveReaction } from './tools/member-posts.js';
import { createOrgTextPostTool, createOrgLinkPostTool, deleteOrgPostTool, getOrgPostsTool, createOrgCommentTool, getPostCommentsTool, getPostReactionsTool, handleCreateOrgTextPost, handleCreateOrgLinkPost, handleDeleteOrgPost, handleGetOrgPosts, handleCreateOrgComment, handleGetPostComments, handleGetPostReactions } from './tools/org-posts.js';
import { listMyPagesTool, getOrganizationTool, updateOrganizationTool, getOrganizationAdminsTool, handleListMyPages, handleGetOrganization, handleUpdateOrganization, handleGetOrganizationAdmins } from './tools/org-management.js';
import { getFollowerStatisticsTool, getPageStatisticsTool, getContentStatisticsTool, handleGetFollowerStatistics, handleGetPageStatistics, handleGetContentStatistics } from './tools/org-analytics.js';
import { previewPostTool, schedulePostTool, scheduleOrgPostTool, listScheduledPostsTool, cancelScheduledPostTool, handlePreviewPost, handleSchedulePost, handleScheduleOrgPost, handleListScheduledPosts, handleCancelScheduledPost } from './tools/scheduling.js';

const TOOLS: Tool[] = [
  // Profile & Network
  getMyProfileTool,
  getConnectionCountTool,
  // Member Posts (w_member_social)
  createTextPostTool,
  createLinkPostTool,
  deletePostTool,
  createCommentTool,
  deleteCommentTool,
  reactToPostTool,
  removeReactionTool,
  // Org Posts (r/w_organization_social)
  createOrgTextPostTool,
  createOrgLinkPostTool,
  deleteOrgPostTool,
  getOrgPostsTool,
  createOrgCommentTool,
  getPostCommentsTool,
  getPostReactionsTool,
  // Org Management (rw_organization_admin)
  listMyPagesTool,
  getOrganizationTool,
  updateOrganizationTool,
  getOrganizationAdminsTool,
  // Org Analytics (r_organization_admin)
  getFollowerStatisticsTool,
  getPageStatisticsTool,
  getContentStatisticsTool,
  // Scheduling & Preview
  previewPostTool,
  schedulePostTool,
  scheduleOrgPostTool,
  listScheduledPostsTool,
  cancelScheduledPostTool,
];

type ToolHandler = (client: LinkedInApiClient, args: unknown) => Promise<unknown>;

const HANDLERS: Record<string, ToolHandler> = {
  get_my_profile: handleGetMyProfile,
  get_connection_count: handleGetConnectionCount,
  create_text_post: handleCreateTextPost,
  create_link_post: handleCreateLinkPost,
  delete_post: handleDeletePost,
  create_comment: handleCreateComment,
  delete_comment: handleDeleteComment,
  react_to_post: handleReactToPost,
  remove_reaction: handleRemoveReaction,
  create_org_text_post: handleCreateOrgTextPost,
  create_org_link_post: handleCreateOrgLinkPost,
  delete_org_post: handleDeleteOrgPost,
  get_org_posts: handleGetOrgPosts,
  create_org_comment: handleCreateOrgComment,
  get_post_comments: handleGetPostComments,
  get_post_reactions: handleGetPostReactions,
  list_my_pages: handleListMyPages,
  get_organization: handleGetOrganization,
  update_organization: handleUpdateOrganization,
  get_organization_admins: handleGetOrganizationAdmins,
  get_follower_statistics: handleGetFollowerStatistics,
  get_page_statistics: handleGetPageStatistics,
  get_content_statistics: handleGetContentStatistics,
  preview_post: handlePreviewPost,
  schedule_post: handleSchedulePost,
  schedule_org_post: handleScheduleOrgPost,
  list_scheduled_posts: handleListScheduledPosts,
  cancel_scheduled_post: handleCancelScheduledPost,
};

class LinkedInSocialMCPServer {
  private server: Server;
  private apiClient: LinkedInApiClient;
  private tokenStore: TokenStore;
  private scheduledPostStore: ScheduledPostStore;

  constructor() {
    this.server = new Server(
      { name: 'linkedin-social-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );
    this.tokenStore = new TokenStore();
    this.apiClient = new LinkedInApiClient(this.tokenStore);
    this.scheduledPostStore = new ScheduledPostStore();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const isAuthenticated = await this.tokenStore.hasValidToken();
      if (!isAuthenticated) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Not authenticated',
              message: 'Run `npm run auth` in the linkedin-social-mcp directory to authenticate with LinkedIn.',
            }),
          }],
          isError: true,
        };
      }

      const handler = HANDLERS[name];
      if (!handler) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
          isError: true,
        };
      }

      try {
        // Inject scheduledPostStore into scheduling-related handlers
        let result: unknown;
        if (['schedule_post', 'schedule_org_post', 'list_scheduled_posts', 'cancel_scheduled_post'].includes(name)) {
          result = await (handler as (client: LinkedInApiClient, args: unknown, store: ScheduledPostStore) => Promise<unknown>)(
            this.apiClient, args ?? {}, this.scheduledPostStore
          );
        } else {
          result = await handler(this.apiClient, args ?? {});
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    });
  }

  // ─── Background scheduler ─────────────────────────────────────────────────
  // Checks every 30 seconds for due scheduled posts and publishes them.

  private startScheduler(): void {
    const CHECK_INTERVAL_MS = 30_000; // 30 seconds

    const tick = async () => {
      const due = this.scheduledPostStore.getDuePosts();
      for (const post of due) {
        try {
          // Skip local-placeholder URNs that were already attempted
          const result = await this.apiClient.createPost({
            authorUrn: post.authorUrn,
            text: post.text,
            visibility: post.visibility as 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN' | undefined,
            articleUrl: post.articleUrl,
          });
          this.scheduledPostStore.markPublished(post.postUrn);
          this.scheduledPostStore.updatePublishedUrn(post.postUrn, result.id);
          console.error(`[scheduler] ✅ Published: ${result.id} (was ${post.postUrn})`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[scheduler] ❌ Failed to publish ${post.postUrn}: ${msg}`);
        }
      }
    };

    setInterval(tick, CHECK_INTERVAL_MS);
    console.error('[scheduler] Background post scheduler started (30s interval)');
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.startScheduler();
    console.error('LinkedIn Social MCP server running on stdio');
  }
}

const server = new LinkedInSocialMCPServer();
server.run().catch(console.error);
