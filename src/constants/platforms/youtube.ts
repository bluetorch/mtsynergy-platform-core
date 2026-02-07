import type { PlatformConfig } from '../types';

export const YOUTUBE_CONFIG: PlatformConfig = {
  platform: 'youtube',
  displayName: 'YouTube',
  brandColor: '#FF0000',
  text: {
    maxCaptionLength: 5000, // Description
    maxHashtags: 15,
    maxMentions: 100,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 43200, // 12 hours
    minDurationSeconds: 1,
    maxFileSizeMB: 262144, // 256GB
    maxResolution: {
      width: 7680,
      height: 4320,
    },
    minResolution: {
      width: 426,
      height: 240,
    },
    supportedCodecs: ['h264', 'h265', 'vp9', 'av1'],
    maxBitrateMbps: 85,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    supportedExtensions: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
  },
  image: {
    maxFileSizeMB: 2, // Thumbnail
    maxResolution: {
      width: 1280,
      height: 720,
    },
    minResolution: {
      width: 640,
      height: 360,
    },
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxImagesPerPost: 1, // Custom thumbnail
  },
  apiRateLimits: {
    requestsPerHour: 10000,
    requestsPerDay: 1000000, // Very high quota system
  },
};
