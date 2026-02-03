import { describe, it, expect } from 'vitest';
import type {
  Platform,
  CreateDraftRequest,
  CreateDraftResponse,
  InboxItem,
  ListInboxResponse,
  ListInboxResponsePagination,
  InboxItemContentTypeEnum,
  InboxItemStatusEnum,
} from '../openapi/src/models';
import {
  CreateDraftRequestFromJSON,
  CreateDraftRequestToJSON,
  CreateDraftResponseFromJSON,
  InboxItemFromJSON,
  ListInboxResponseFromJSON,
  Platform as PlatformEnum,
  InboxItemContentTypeEnum as ContentType,
  InboxItemStatusEnum as StatusEnum,
} from '../openapi/src/models';

describe('Module Exports - Generated Types', () => {
  it('should import Platform enum type', () => {
    const platform: Platform = PlatformEnum.Twitter;
    expect(platform).toBe('twitter');
  });

  it('should import CreateDraftRequest type', () => {
    const request: CreateDraftRequest = {
      caption: 'Test Post',
      platforms: [PlatformEnum.Twitter],
    };
    expect(request.caption).toBe('Test Post');
  });

  it('should import CreateDraftResponse type', () => {
    const response: CreateDraftResponse = {
      id: '123',
      status: 'DRAFT',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    expect(response.id).toBe('123');
  });

  it('should import InboxItem type', () => {
    const item: InboxItem = {
      id: '1',
      workspaceId: 'ws1',
      platform: PlatformEnum.Twitter,
      platformItemId: 'tweet123',
      author: 'user@example.com',
      content: 'Test content',
      contentType: ContentType.Comment,
      status: StatusEnum.New,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
    expect(item.platform).toBe('twitter');
  });

  it('should import ListInboxResponse type', () => {
    const pagination: ListInboxResponsePagination = {
      page: 1,
      pageSize: 10,
      total: 100,
    };
    const list: ListInboxResponse = {
      items: [],
      pagination,
    };
    expect(Array.isArray(list.items)).toBe(true);
  });

  it('should have generated converter functions available', () => {
    expect(typeof CreateDraftRequestFromJSON).toBe('function');
    expect(typeof CreateDraftRequestToJSON).toBe('function');
    expect(typeof CreateDraftResponseFromJSON).toBe('function');
    expect(typeof InboxItemFromJSON).toBe('function');
    expect(typeof ListInboxResponseFromJSON).toBe('function');
  });

  it('should convert JSON to CreateDraftRequest', () => {
    const json = {
      caption: 'Test Post',
      platforms: ['twitter', 'instagram'],
    };
    const request = CreateDraftRequestFromJSON(json);
    expect(request.caption).toBe('Test Post');
    expect(Array.isArray(request.platforms)).toBe(true);
  });

  it('should convert CreateDraftRequest to JSON', () => {
    const request: CreateDraftRequest = {
      caption: 'Test Post',
      platforms: [PlatformEnum.Twitter],
    };
    const json = CreateDraftRequestToJSON(request);
    expect(json.caption).toBe('Test Post');
    expect(Array.isArray(json.platforms)).toBe(true);
  });
});
