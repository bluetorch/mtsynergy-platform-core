import { describe, it, expect } from 'vitest';
import type {
  CreateDraftRequest,
  CreateDraftResponse,
  InboxItem,
  ListInboxResponse,
  ListInboxResponsePagination,
} from '../openapi';
import { Platform } from '../openapi';

describe('BFF OpenAPI Spec Integration', () => {
  describe('Tier 1 Critical Types', () => {
    it('should generate CreateDraftRequest type', () => {
      const request: CreateDraftRequest = {
        caption: 'Test post',
        platforms: ['twitter', 'tiktok'],
      };

      expect(request.caption).toBeDefined();
      expect(request.platforms).toBeDefined();
      expect(Array.isArray(request.platforms)).toBe(true);
    });

    it('should generate CreateDraftResponse type', () => {
      const response: CreateDraftResponse = {
        id: 'draft-123',
        status: 'DRAFT',
        createdAt: new Date('2026-02-03T10:00:00Z'),
        updatedAt: new Date('2026-02-03T10:00:00Z'),
      };

      expect(response.id).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.createdAt instanceof Date).toBe(true);
    });

    it('should generate InboxItem type', () => {
      const item: InboxItem = {
        id: 'inbox-123',
        workspaceId: 'workspace-1',
        platform: 'twitter',
        platformItemId: 'tweet-123',
        author: 'john_doe',
        content: 'Test content',
        contentType: 'MENTION',
        status: 'NEW',
        createdAt: new Date('2026-02-03T10:00:00Z'),
      };

      expect(item.id).toBeDefined();
      expect(item.platform).toBeDefined();
      expect(item.createdAt instanceof Date).toBe(true);
    });

    it('should generate Platform enum with correct values', () => {
      const expectedPlatforms = [
        'twitter',
        'tiktok',
        'facebook',
        'instagram',
        'linkedin',
        'youtube',
      ];

      // Platform is an object with string values
      const platformValues = Object.values(Platform);

      expectedPlatforms.forEach((platform) => {
        expect(platformValues).toContain(platform);
      });
    });
  });

  describe('Tier 2 Supporting Types', () => {
    it('should generate ListInboxResponse type', () => {
      const response: ListInboxResponse = {
        items: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
        },
      };

      expect(response.items).toBeDefined();
      expect(response.pagination).toBeDefined();
    });

    it('should generate ListInboxResponsePagination type', () => {
      const pagination: ListInboxResponsePagination = {
        page: 1,
        pageSize: 20,
        total: 100,
      };

      expect(pagination.page).toBe(1);
      expect(pagination.pageSize).toBe(20);
      expect(pagination.total).toBe(100);
    });
  });

  describe('Type Relationships', () => {
    it('should allow CreateDraftRequest with optional fields', () => {
      const request: CreateDraftRequest = {
        caption: 'Test post with media',
        platforms: ['twitter'],
        scheduledAt: new Date('2026-02-04T14:00:00Z'),
        mediaIds: ['media-1', 'media-2'],
      };

      expect(request.scheduledAt).toBeDefined();
      expect(request.mediaIds).toHaveLength(2);
    });

    it('should allow InboxItem with required fields only', () => {
      const item: InboxItem = {
        id: 'inbox-456',
        workspaceId: 'workspace-2',
        platform: 'instagram',
        platformItemId: 'dm-123',
        author: 'jane_smith',
        content: 'DM content',
        contentType: 'MESSAGE',
        status: 'ASSIGNED',
        createdAt: new Date('2026-02-03T10:00:00Z'),
      };

      expect(item.author).toBe('jane_smith');
      expect(item.content).toBe('DM content');
      expect(item.status).toBe('ASSIGNED');
    });
  });
});
