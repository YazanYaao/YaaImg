import { PlatformPreset } from '@/types';

export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';

export interface PresetMeta {
  key: PlatformPreset;
  platform: SocialPlatform;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export interface PlatformTab {
  id: SocialPlatform;
  name: string;
  icon: string;
}

export const PLATFORM_TABS: PlatformTab[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'twitter', name: 'X / Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
];

export const PRESETS: Record<PlatformPreset, PresetMeta> = {
  instagram_post: {
    key: 'instagram_post',
    platform: 'instagram',
    label: 'Feed Post',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
  },
  instagram_story: {
    key: 'instagram_story',
    platform: 'instagram',
    label: 'Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },
  instagram_reel_cover: {
    key: 'instagram_reel_cover',
    platform: 'instagram',
    label: 'Reel Cover',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },

  facebook_post: {
    key: 'facebook_post',
    platform: 'facebook',
    label: 'Feed Post',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
  },
  facebook_cover: {
    key: 'facebook_cover',
    platform: 'facebook',
    label: 'Page Cover',
    width: 820,
    height: 312,
    aspectRatio: '2.6:1',
  },
  facebook_story: {
    key: 'facebook_story',
    platform: 'facebook',
    label: 'Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },

  twitter_post: {
    key: 'twitter_post',
    platform: 'twitter',
    label: 'Timeline Post',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
  },
  twitter_header: {
    key: 'twitter_header',
    platform: 'twitter',
    label: 'Header Banner',
    width: 1500,
    height: 500,
    aspectRatio: '3:1',
  },

  linkedin_post: {
    key: 'linkedin_post',
    platform: 'linkedin',
    label: 'Feed Post',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
  },
  linkedin_banner: {
    key: 'linkedin_banner',
    platform: 'linkedin',
    label: 'Company Banner',
    width: 1584,
    height: 396,
    aspectRatio: '4:1',
  },

  tiktok_video_cover: {
    key: 'tiktok_video_cover',
    platform: 'tiktok',
    label: 'Video Cover',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },

  youtube_thumbnail: {
    key: 'youtube_thumbnail',
    platform: 'youtube',
    label: 'Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
  },
  youtube_banner: {
    key: 'youtube_banner',
    platform: 'youtube',
    label: 'Channel Banner',
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
  },
};

export function getPresetsByPlatform(platform: SocialPlatform): PresetMeta[] {
  return Object.values(PRESETS).filter((p) => p.platform === platform);
}

export function getPresetMeta(key: PlatformPreset): PresetMeta {
  return PRESETS[key] || PRESETS.instagram_post;
}
