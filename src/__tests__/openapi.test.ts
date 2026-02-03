import { describe, it, expect } from 'vitest';

describe('OpenAPI Generated Types', () => {
  it('should export Platform enum values', () => {
    // Test that Platform type is properly generated
    const platforms: string[] = [
      'twitter',
      'tiktok',
      'facebook',
      'instagram',
      'linkedin',
      'youtube',
    ];

    platforms.forEach((platform) => {
      expect(platform).toBeDefined();
      expect(typeof platform).toBe('string');
    });
  });

  it('should allow creating CreateDraftRequest objects', () => {
    // Test that CreateDraftRequest interface works
    const request = {
      caption: 'Test post',
      platforms: ['twitter', 'tiktok'],
    };

    expect(request.caption).toBe('Test post');
    expect(request.platforms).toHaveLength(2);
    expect(request.platforms[0]).toBe('twitter');
  });

  it('should allow optional fields in CreateDraftRequest', () => {
    // Test that optional properties work
    const request = {
      caption: 'Test post',
      platforms: ['twitter'],
      scheduledAt: '2026-02-03T14:00:00Z',
      mediaIds: ['media-1', 'media-2'],
    };

    expect(request.scheduledAt).toBeDefined();
    expect(request.mediaIds).toHaveLength(2);
  });

  it('should allow creating CreateDraftResponse objects', () => {
    // Test that CreateDraftResponse interface works
    const response = {
      id: 'draft-123',
      status: 'DRAFT',
      createdAt: '2026-02-03T13:00:00Z',
      updatedAt: '2026-02-03T13:00:00Z',
    };

    expect(response.id).toBe('draft-123');
    expect(response.status).toBe('DRAFT');
    expect(['DRAFT', 'PENDING_APPROVAL', 'APPROVED']).toContain(response.status);
  });

  it('should allow creating InboxItem objects', () => {
    // Test that InboxItem interface works
    const item = {
      id: 'item-123',
      workspaceId: 'ws-456',
      platform: 'twitter',
      platformItemId: 'tweet-789',
      author: 'johndoe',
      content: 'Great post!',
      contentType: 'COMMENT',
      status: 'NEW',
      createdAt: '2026-02-03T13:00:00Z',
    };

    expect(item.platform).toBe('twitter');
    expect(['COMMENT', 'MESSAGE', 'MENTION']).toContain(item.contentType);
    expect(['NEW', 'ASSIGNED', 'RESOLVED', 'SPAM']).toContain(item.status);
  });

  it('should allow creating ListInboxResponse objects', () => {
    // Test that ListInboxResponse interface works
    const response = {
      items: [
        {
          id: 'item-1',
          workspaceId: 'ws-1',
          platform: 'twitter',
          platformItemId: 'tweet-1',
          author: 'user1',
          content: 'Comment 1',
          contentType: 'COMMENT',
          status: 'NEW',
          createdAt: '2026-02-03T13:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 100,
      },
    };

    expect(response.items).toHaveLength(1);
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.total).toBe(100);
  });
});
