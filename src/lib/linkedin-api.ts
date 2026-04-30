import type { TokenStore } from '../auth/token-store.js';
import type {
  LinkedInProfile,
  UgcPost,
  SocialComment,
  SocialReaction,
  LinkedInOrganization,
  OrganizationAcl,
  FollowerStatistics,
  PageStatistics,
  ShareStatistics,
  RegisterUploadResponse,
  ApiListResponse,
} from './types.js';

const API_V2 = 'https://api.linkedin.com/v2';
const LINKEDIN_VERSION = '202601';

export class LinkedInApiClient {
  private tokenStore: TokenStore;

  constructor(tokenStore: TokenStore) {
    this.tokenStore = tokenStore;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.tokenStore.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated. Run: npm run auth');
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${API_V2}${endpoint}`;
    const hdrs = await this.headers();

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        method,
        headers: hdrs,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
        await sleep(retryAfter * 1000 * Math.pow(2, attempt));
        continue;
      }

      if (res.status === 204 || res.status === 201) {
        const location = res.headers.get('x-restli-id') || res.headers.get('location') || '';
        return { id: location } as T;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LinkedIn API ${res.status} on ${method} ${endpoint}: ${text}`);
      }

      return res.json() as Promise<T>;
    }

    throw new Error(`LinkedIn API: max retries exceeded on ${method} ${endpoint}`);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getMyProfile(): Promise<LinkedInProfile> {
    return this.request<LinkedInProfile>(
      'GET',
      '/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,vanityName)',
    );
  }

  async getConnectionCount(personUrn: string): Promise<{ firstDegreeSize: number }> {
    const encoded = encodeURIComponent(personUrn);
    return this.request<{ firstDegreeSize: number }>(
      'GET',
      `/networkSizes/${encoded}?edgeType=FirstDegreeConnection`,
    );
  }

  // ─── Member Posts (w_member_social) ───────────────────────────────────────

  async createPost(params: {
    authorUrn: string;
    text: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN';
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
    imageAssetUrn?: string;
  }): Promise<{ id: string }> {
    const mediaCategory = params.imageAssetUrn
      ? 'IMAGE'
      : params.articleUrl
      ? 'ARTICLE'
      : 'NONE';

    const media: object[] = [];

    if (params.imageAssetUrn) {
      media.push({ status: 'READY', media: params.imageAssetUrn });
    } else if (params.articleUrl) {
      media.push({
        status: 'READY',
        originalUrl: params.articleUrl,
        ...(params.articleTitle && { title: { text: params.articleTitle } }),
        ...(params.articleDescription && { description: { text: params.articleDescription } }),
      });
    }

    return this.request<{ id: string }>('POST', '/ugcPosts', {
      author: params.authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: params.text },
          shareMediaCategory: mediaCategory,
          ...(media.length > 0 && { media }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': params.visibility ?? 'PUBLIC',
      },
    });
  }

  async deletePost(postUrn: string): Promise<void> {
    await this.request<void>('DELETE', `/ugcPosts/${encodeURIComponent(postUrn)}`);
  }

  async createComment(params: {
    postUrn: string;
    actorUrn: string;
    text: string;
  }): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      'POST',
      `/socialActions/${encodeURIComponent(params.postUrn)}/comments`,
      { actor: params.actorUrn, message: { text: params.text } },
    );
  }

  async deleteComment(postUrn: string, commentUrn: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/socialActions/${encodeURIComponent(postUrn)}/comments/${encodeURIComponent(commentUrn)}`,
    );
  }

  async reactToPost(postUrn: string, actorUrn: string): Promise<void> {
    await this.request<void>(
      'POST',
      `/socialActions/${encodeURIComponent(postUrn)}/likes`,
      { actor: actorUrn },
    );
  }

  async removeReaction(postUrn: string, actorUrn: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/socialActions/${encodeURIComponent(postUrn)}/likes/${encodeURIComponent(actorUrn)}`,
    );
  }

  // ─── Org Posts (r_organization_social / w_organization_social) ────────────

  async getOrgPosts(orgUrn: string, count = 10, start = 0): Promise<ApiListResponse<UgcPost>> {
    const encoded = encodeURIComponent(orgUrn);
    return this.request<ApiListResponse<UgcPost>>(
      'GET',
      `/ugcPosts?q=authors&authors=List(${encoded})&count=${count}&start=${start}`,
    );
  }

  async getPostComments(postUrn: string, count = 10, start = 0): Promise<ApiListResponse<SocialComment>> {
    return this.request<ApiListResponse<SocialComment>>(
      'GET',
      `/socialActions/${encodeURIComponent(postUrn)}/comments?count=${count}&start=${start}`,
    );
  }

  async getPostReactions(postUrn: string, count = 10, start = 0): Promise<ApiListResponse<SocialReaction>> {
    return this.request<ApiListResponse<SocialReaction>>(
      'GET',
      `/socialActions/${encodeURIComponent(postUrn)}/likes?count=${count}&start=${start}`,
    );
  }

  // ─── Organization Management (rw_organization_admin) ──────────────────────

  async getOrganization(orgId: string): Promise<LinkedInOrganization> {
    return this.request<LinkedInOrganization>(
      'GET',
      `/organizations/${orgId}?projection=(id,name,localizedName,description,logoV2,websiteUrl,followersCount,vanityName,specialties,foundedOn,staffCountRange,industries)`,
    );
  }

  async updateOrganization(orgId: string, patch: Record<string, unknown>): Promise<void> {
    await this.request<void>('POST', `/organizations/${orgId}`, patch);
  }

  async getOrganizationAdmins(orgUrn: string): Promise<ApiListResponse<OrganizationAcl>> {
    return this.request<ApiListResponse<OrganizationAcl>>(
      'GET',
      `/organizationAcls?q=organization&organization=${encodeURIComponent(orgUrn)}&projection=(elements*(roleAssignee,role,organization,state))`,
    );
  }

  // ─── Organization Analytics (r_organization_admin) ────────────────────────

  async getFollowerStatistics(orgUrn: string): Promise<ApiListResponse<FollowerStatistics>> {
    return this.request<ApiListResponse<FollowerStatistics>>(
      'GET',
      `/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`,
    );
  }

  async getPageStatistics(orgUrn: string): Promise<ApiListResponse<PageStatistics>> {
    return this.request<ApiListResponse<PageStatistics>>(
      'GET',
      `/organizationPageStatistics?q=organization&organization=${encodeURIComponent(orgUrn)}`,
    );
  }

  async getShareStatistics(
    orgUrn: string,
    shareUrn?: string,
  ): Promise<ApiListResponse<ShareStatistics>> {
    const entityParam = shareUrn
      ? `shareUrn=${encodeURIComponent(shareUrn)}`
      : `organizationalEntity=${encodeURIComponent(orgUrn)}`;
    return this.request<ApiListResponse<ShareStatistics>>(
      'GET',
      `/shareStatistics?q=organizationalEntity&${entityParam}`,
    );
  }

  // ─── Scheduling (w_member_social / w_organization_social) ────────────────

  async createScheduledPost(params: {
    authorUrn: string;
    text: string;
    scheduledPublishTime: number;
    visibility?: string;
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
    imageAssetUrn?: string;
  }): Promise<{ id: string }> {
    const mediaCategory = params.imageAssetUrn
      ? 'IMAGE'
      : params.articleUrl
      ? 'ARTICLE'
      : 'NONE';

    const media: object[] = [];
    if (params.imageAssetUrn) {
      media.push({ status: 'READY', media: params.imageAssetUrn });
    } else if (params.articleUrl) {
      media.push({
        status: 'READY',
        originalUrl: params.articleUrl,
        ...(params.articleTitle && { title: { text: params.articleTitle } }),
        ...(params.articleDescription && { description: { text: params.articleDescription } }),
      });
    }

    return this.request<{ id: string }>('POST', '/ugcPosts', {
      author: params.authorUrn,
      lifecycleState: 'DRAFT',
      scheduledPublishTime: params.scheduledPublishTime,
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: params.text },
          shareMediaCategory: mediaCategory,
          ...(media.length > 0 && { media }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': params.visibility ?? 'PUBLIC',
      },
    });
  }

  async getScheduledPosts(authorUrn: string, count = 20, start = 0): Promise<ApiListResponse<UgcPost>> {
    const encoded = encodeURIComponent(authorUrn);
    return this.request<ApiListResponse<UgcPost>>(
      'GET',
      `/ugcPosts?q=authors&authors=List(${encoded})&lifecycleState=DRAFT&count=${count}&start=${start}`,
    );
  }

  // ─── Image Upload (w_member_social / w_organization_social) ───────────────

  async registerImageUpload(ownerUrn: string): Promise<RegisterUploadResponse> {
    return this.request<RegisterUploadResponse>('POST', '/assets?action=registerUpload', {
      registerUploadRequest: {
        owner: ownerUrn,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [
          { identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' },
        ],
      },
    });
  }

  async uploadImageBytes(uploadUrl: string, imageBuffer: Buffer, headers: Record<string, string>): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/octet-stream' },
      body: imageBuffer,
    });
    if (!res.ok) {
      throw new Error(`Image upload failed (${res.status}): ${await res.text()}`);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
