export interface LinkedInTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
  expires_at: number;
}

export interface LinkedInProfile {
  id: string;
  firstName: { localized: Record<string, string>; preferredLocale: { country: string; language: string } };
  lastName: { localized: Record<string, string>; preferredLocale: { country: string; language: string } };
  profilePicture?: { displayImage: string };
  headline?: { localized: Record<string, string> };
  vanityName?: string;
}

export interface UgcPost {
  id: string;
  author: string;
  lifecycleState: string;
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: { text: string };
      shareMediaCategory: string;
      media?: Array<{
        status: string;
        description?: { text: string };
        media?: string;
        originalUrl?: string;
        title?: { text: string };
      }>;
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': string;
  };
  scheduledPublishTime?: number;
  created?: { time: number; actor: string };
  lastModified?: { time: number; actor: string };
  statistics?: { likeCount: number; commentCount: number; shareCount: number; impressionCount: number };
}

export interface SocialComment {
  id: string;
  actor: string;
  message: { text: string };
  created?: { time: number; actor: string };
  object: string;
}

export interface SocialReaction {
  actor: string;
  reactionType: string;
  created?: { time: number };
}

export interface LinkedInOrganization {
  id: number;
  name: { localized: Record<string, string>; preferredLocale: { country: string; language: string } };
  description?: { localized: Record<string, string>; preferredLocale: { country: string; language: string } };
  logoV2?: { original: string; cropped: string };
  websiteUrl?: string;
  followersCount?: number;
  vanityName?: string;
  specialties?: string[];
  foundedOn?: { year: number; month?: number; day?: number };
  staffCountRange?: { start: number; end: number };
  industries?: string[];
  localizedName?: string;
}

export interface OrganizationAcl {
  roleAssignee: string;
  role: string;
  organization: string;
  state: string;
}

export interface FollowerStatistics {
  organizationalEntity: string;
  followerCountsByAssociationType?: Array<{
    followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
    associationType: string;
  }>;
  followerCountsByRegion?: Array<{
    followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
    region: string;
  }>;
  followerCountsByIndustry?: Array<{
    followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
    industry: string;
  }>;
  followerCountsBySeniority?: Array<{
    followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
    seniority: string;
  }>;
  followerCountsByFunction?: Array<{
    followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
    function: string;
  }>;
  totalFollowerCounts?: { organicFollowerCount: number; paidFollowerCount: number };
}

export interface PageStatistics {
  organizationalEntity: string;
  totalPageStatistics?: {
    views: {
      allDesktopPageViews?: { pageViews: number };
      allMobilePageViews?: { pageViews: number };
      overviewDesktopPageViews?: { pageViews: number };
      overviewMobilePageViews?: { pageViews: number };
      jobsDesktopPageViews?: { pageViews: number };
      jobsMobilePageViews?: { pageViews: number };
    };
    uniqueViews: {
      allDesktopUniquePageViews?: { pageViews: number };
      allMobileUniquePageViews?: { pageViews: number };
    };
  };
}

export interface ShareStatistics {
  organizationalEntity: string;
  totalShareStatistics?: {
    impressionCount: number;
    uniqueImpressionsCount: number;
    clickCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    engagement: number;
  };
}

export interface NetworkSize {
  firstDegreeSize: number;
}

export interface RegisterUploadResponse {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
        headers: Record<string, string>;
      };
    };
    mediaArtifact: string;
    asset: string;
  };
}

export interface ApiListResponse<T> {
  elements: T[];
  paging?: {
    total: number;
    count: number;
    start: number;
  };
}
