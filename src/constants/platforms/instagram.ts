import type { PlatformConfig } from '../types';

export const INSTAGRAM_CONFIG: PlatformConfig = {
  platform: 'instagram',
  displayName: 'Instagram',
  brandColor: '#E4405F',
  text: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    maxMentions: 30,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: false, // Only in stories/bio
  },
  video: {
    maxDurationSeconds: 900, // 15 minutes (IGTV), 60s (Feed), 90s (Reels)
    minDurationSeconds: 3,
    maxFileSizeMB: 100,
    maxResolution: {
      width: 1920,
      height: 1920,
    },
    minResolution: {
      width: 600,
      height: 600,
    },
    supportedCodecs: ['h264'],
    maxBitrateMbps: 5,
    maxFrameRate: 30,
    aspectRatios: ['1:1', '4:5', '16:9', '9:16'],
    supportedExtensions: ['mp4', 'mov'],
  },
  image: {
    maxFileSizeMB: 8,
    maxResolution: {
      width: 1080,
      height: 1350,
    },
    minResolution: {
      width: 320,
      height: 320,
    },
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxImagesPerPost: 10,
  },
  apiRateLimits: {
    requestsPerHour: 200,
    requestsPerDay: 4800,
  },
};
