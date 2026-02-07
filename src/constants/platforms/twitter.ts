import type { PlatformConfig } from '../types';

export const TWITTER_CONFIG: PlatformConfig = {
  platform: 'twitter',
  displayName: 'Twitter / X',
  brandColor: '#1DA1F2',
  text: {
    maxCaptionLength: 280,
    maxHashtags: 30,
    maxMentions: 50,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 140, // 2:20
    minDurationSeconds: 0.5,
    maxFileSizeMB: 512,
    maxResolution: {
      width: 1920,
      height: 1200,
    },
    minResolution: {
      width: 32,
      height: 32,
    },
    supportedCodecs: ['h264', 'h265'],
    maxBitrateMbps: 25,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '1:1'],
    supportedExtensions: ['mp4', 'mov'],
  },
  image: {
    maxFileSizeMB: 5,
    maxResolution: {
      width: 8192,
      height: 8192,
    },
    minResolution: {
      width: 4,
      height: 4,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxImagesPerPost: 4,
  },
  apiRateLimits: {
    requestsPerHour: 300,
    requestsPerDay: 2400,
  },
};
