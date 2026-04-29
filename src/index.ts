#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';

import { LinkedInApiClient } from './lib/linkedin-api.js';
import { TokenStore } from './auth/token-store.js';

import { getMyProfileTool, getConnectionCountTool, handleGetMyProfile, handleGetConnectionCount } from './tools/profile.js';
import { createTextPostTool, createLinkPostTool, deletePostTool, createCommentTool, deleteCommentTool, reactToPostTool, removeReactionTool, handleCreateTextPost, handleCreateLinkPost, handleDeletePost, handleCreateComment, handleDeleteComment, handleReactToPost, handleRemoveReaction } from './tools/member-posts.js';
import { createOrgTextPostTool, createOrgLinkPostTool, deleteOrgPostTool, getOrgPostsTool, createOrgCommentTool, getPostCommentsTool, getPostReactionsTool, handleCreateOrgTextPost, handleCreateOrgLinkPost, handleDeleteOrgPost, handleGetOrgPosts, handleCreateOrgComment, handleGetPostComments, handleGetPostReactions } from './tools/org-posts.js';
import { getOrganizationTool, updateOrganizationTool, getOrganizationAdminsTool, handleGetOrganization, handleUpdateOrganization, handleGetOrganizationAdmins } from './tools/org-management.js';
import { getFollowerStatisticsTool, getPageStatisticsTool, getContentStatisticsTool, handleGetFollowerStatistics, handleGetPageStatistics, handleGetContentStatistics } from './tools/org-analytics.js';

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
  getOrganizationTool,
  updateOrganizationTool,
  getOrganizationAdminsTool,
  // Org Analytics (r_organization_admin)
  getFollowerStatisticsTool,
  getPageStatisticsTool,
  getContentStatisticsTool,
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
  get_organization: handleGetOrganization,
  update_organization: handleUpdateOrganization,
  get_organization_admins: handleGetOrganizationAdmins,
  get_follower_statistics: handleGetFollowerStatistics,
  get_page_statistics: handleGetPageStatistics,
  get_content_statistics: handleGetContentStatistics,
};

class LinkedInSocialMCPServer {
  private server: Server;
  private apiClient: LinkedInApiClient;
  private tokenStore: TokenStore;

  constructor() {
    this.server = new Server(
      { name: 'linkedin-social-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );
    this.tokenStore = new TokenStore();
    this.apiClient = new LinkedInApiClient(this.tokenStore);
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
        const result = await handler(this.apiClient, args ?? {});
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LinkedIn Social MCP server running on stdio');
  }
}

const server = new LinkedInSocialMCPServer();
server.run().catch(console.error);
