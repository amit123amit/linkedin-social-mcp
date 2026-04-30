import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEFAULT_STORE_DIR = path.join(os.homedir(), '.linkedin-social-mcp');
const DEFAULT_STORE_PATH = path.join(DEFAULT_STORE_DIR, 'scheduled-posts.json');

export type ScheduledPostStatus = 'SCHEDULED' | 'PUBLISHED' | 'CANCELLED';

export interface ScheduledPostRecord {
  postUrn: string;
  authorUrn: string;
  authorName?: string;
  text: string;
  visibility: string;
  scheduledFor: string;        // ISO string
  scheduledForLocal: string;   // Human readable local time
  createdAt: string;           // ISO string when we scheduled it
  status: ScheduledPostStatus;
  articleUrl?: string;
  type: 'personal' | 'org';
  orgName?: string;
}

export class ScheduledPostStore {
  private storePath: string;
  private posts: ScheduledPostRecord[] = [];

  constructor(storePath?: string) {
    this.storePath = storePath || process.env.SCHEDULED_POSTS_PATH || DEFAULT_STORE_PATH;
    this.ensureDirectory();
    this.loadFromDisk();
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf-8');
        this.posts = JSON.parse(raw) as ScheduledPostRecord[];
      }
    } catch {
      this.posts = [];
    }
  }

  private saveToDisk(): void {
    fs.writeFileSync(this.storePath, JSON.stringify(this.posts, null, 2), { mode: 0o600 });
  }

  addPost(record: ScheduledPostRecord): void {
    // Remove any existing record with same URN to avoid duplicates
    this.posts = this.posts.filter(p => p.postUrn !== record.postUrn);
    this.posts.unshift(record); // newest first
    this.saveToDisk();
  }

  cancelPost(postUrn: string): boolean {
    const idx = this.posts.findIndex(p => p.postUrn === postUrn);
    if (idx === -1) return false;
    this.posts[idx].status = 'CANCELLED';
    this.saveToDisk();
    return true;
  }

  markPublished(postUrn: string): boolean {
    const idx = this.posts.findIndex(p => p.postUrn === postUrn);
    if (idx === -1) return false;
    this.posts[idx].status = 'PUBLISHED';
    this.saveToDisk();
    return true;
  }

  // Update the postUrn with the real LinkedIn URN after publish
  updatePublishedUrn(localPostUrn: string, realUrn: string): void {
    const idx = this.posts.findIndex(p => p.postUrn === localPostUrn);
    if (idx !== -1 && realUrn) {
      this.posts[idx].postUrn = realUrn;
      this.saveToDisk();
    }
  }

  getAll(authorUrn?: string): ScheduledPostRecord[] {
    if (authorUrn) return this.posts.filter(p => p.authorUrn === authorUrn);
    return this.posts;
  }

  getScheduled(authorUrn?: string): ScheduledPostRecord[] {
    return this.getAll(authorUrn).filter(p => p.status === 'SCHEDULED');
  }

  getByUrn(postUrn: string): ScheduledPostRecord | undefined {
    return this.posts.find(p => p.postUrn === postUrn);
  }

  // Returns posts that are SCHEDULED and whose scheduledFor time has passed — ready to publish
  getDuePosts(): ScheduledPostRecord[] {
    const now = new Date();
    return this.posts.filter(
      p => p.status === 'SCHEDULED' && new Date(p.scheduledFor) <= now,
    );
  }

  // No-op kept for call-site compatibility — status is only updated via markPublished/cancelPost
  syncStatuses(): void {
    // Intentionally empty: do NOT auto-expire to PUBLISHED based on time alone.
    // Actual publishing is handled by the background scheduler in index.ts.
  }
}
