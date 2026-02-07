import { describe, it, expect } from 'vitest';
import {
  PLATFORM_CONFIGS,
  getPlatformConfig,
  getPlatformConfigs,
  hasWorkspacePermission,
  isValidTimezone,
  type Platform,
} from '../constants';

describe('Constants Integration', () => {
  it('should validate caption length across platforms', () => {
    const caption = 'A'.repeat(300);

    // Twitter: max 280
    expect(caption.length <= PLATFORM_CONFIGS.twitter.text.maxCaptionLength).toBe(false);

    // Instagram: max 2200
    expect(caption.length <= PLATFORM_CONFIGS.instagram.text.maxCaptionLength).toBe(true);
  });

  it('should check video requirements for multi-platform post', () => {
    const videoDuration = 90; // 1:30 seconds
    const platforms: Platform[] = ['twitter', 'instagram', 'tiktok'];

    const configs = getPlatformConfigs(platforms);

    configs.forEach((config) => {
      const isValid = videoDuration <= config.video.maxDurationSeconds;

      // All three should support 90s video
      expect(isValid).toBe(true);
    });
  });

  it('should validate permissions for workspace actions', () => {
    // Only OWNER or ADMIN can delete workspace
    expect(hasWorkspacePermission('OWNER', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('MEMBER', 'ADMIN')).toBe(false);
  });

  it('should support timezone selection', () => {
    const userSelectedTimezone = 'America/New_York';

    expect(isValidTimezone(userSelectedTimezone)).toBe(true);

    // Invalid timezone
    expect(isValidTimezone('Not/A/Timezone')).toBe(false);
  });

  it('should get platform configs dynamically', () => {
    const platforms: Platform[] = ['twitter', 'facebook'];
    const configs = getPlatformConfigs(platforms);

    expect(configs).toHaveLength(2);
    expect(configs[0].platform).toBe('twitter');
    expect(configs[1].platform).toBe('facebook');
  });

  it('should validate video file for multiple platforms', () => {
    const videoFile = {
      durationSeconds: 120,
      fileSizeMB: 50,
      codec: 'h264' as const,
    };

    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin'];

    platforms.forEach((platform) => {
      const config = getPlatformConfig(platform);

      const isDurationValid = videoFile.durationSeconds <= config.video.maxDurationSeconds;
      const isSizeValid = videoFile.fileSizeMB <= config.video.maxFileSizeMB;
      const isCodecSupported = config.video.supportedCodecs.includes(videoFile.codec);

      expect(isDurationValid).toBe(true);
      expect(isSizeValid).toBe(true);
      expect(isCodecSupported).toBe(true);
    });
  });
});
