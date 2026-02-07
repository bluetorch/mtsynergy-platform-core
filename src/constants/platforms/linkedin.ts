import type { PlatformConfig } from '../types';

export const LINKEDIN_CONFIG: PlatformConfig = {
  platform: 'linkedin',
  displayName: 'LinkedIn',
  brandColor: '#0A66C2',
  text: {
    maxCaptionLength: 3000,
    maxHashtags: 30,
    maxMentions: 50,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 600, // 10 minutes
    minDurationSeconds: 3,
    maxFileSizeMB: 5120, // 5GB
    maxResolution: {
      width: 4096,
      height: 2304,
    },
    minResolution: {
      width: 256,
      height: 144,
    },
    supportedCodecs: ['h264'],
    maxBitrateMbps: 10,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '1:1', '9:16'],
    supportedExtensions: ['mp4', 'mov', 'avi'],
  },
  image: {
    maxFileSizeMB: 10,
    maxResolution: {
      width: 7680,
      height: 4320,
    },
    minResolution: {
      width: 200,
      height: 200,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxImagesPerPost: 9,
  },
  apiRateLimits: {
    requestsPerHour: 100,
    requestsPerDay: 2000,
  },
};
