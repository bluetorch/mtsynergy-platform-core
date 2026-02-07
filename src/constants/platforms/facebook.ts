import type { PlatformConfig } from '../types';

export const FACEBOOK_CONFIG: PlatformConfig = {
  platform: 'facebook',
  displayName: 'Facebook',
  brandColor: '#1877F2',
  text: {
    maxCaptionLength: 63206,
    maxHashtags: 30,
    maxMentions: 50,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 14400, // 240 minutes
    minDurationSeconds: 1,
    maxFileSizeMB: 10240, // 10GB
    maxResolution: {
      width: 4096,
      height: 4096,
    },
    minResolution: {
      width: 120,
      height: 120,
    },
    supportedCodecs: ['h264', 'vp9'],
    maxBitrateMbps: 8,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    supportedExtensions: ['mp4', 'mov'],
  },
  image: {
    maxFileSizeMB: 10,
    maxResolution: {
      width: 8192,
      height: 8192,
    },
    minResolution: {
      width: 200,
      height: 200,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxImagesPerPost: 10,
  },
  apiRateLimits: {
    requestsPerHour: 200,
    requestsPerDay: 4800,
  },
};
