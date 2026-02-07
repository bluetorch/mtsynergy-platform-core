import type { PlatformConfig } from '../types';

export const TIKTOK_CONFIG: PlatformConfig = {
  platform: 'tiktok',
  displayName: 'TikTok',
  brandColor: '#000000',
  text: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    maxMentions: 20,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: false, // No clickable links in captions
  },
  video: {
    maxDurationSeconds: 600, // 10 minutes
    minDurationSeconds: 1,
    maxFileSizeMB: 287.6,
    maxResolution: {
      width: 1080,
      height: 1920,
    },
    minResolution: {
      width: 360,
      height: 640,
    },
    supportedCodecs: ['h264', 'h265'],
    maxBitrateMbps: 16,
    maxFrameRate: 60,
    aspectRatios: ['9:16', '1:1'],
    supportedExtensions: ['mp4', 'mov', 'webm'],
  },
  image: {
    maxFileSizeMB: 10,
    maxResolution: {
      width: 1080,
      height: 1920,
    },
    minResolution: {
      width: 360,
      height: 640,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxImagesPerPost: 35, // Photo carousel
  },
  apiRateLimits: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
};
