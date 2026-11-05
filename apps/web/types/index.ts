export type KitStatus = 'not_started' | 'in_progress' | 'complete';

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  kit_status: KitStatus;
  created_at: string;
}

export interface CreateBrandRequest {
  name: string;
}

export interface BrandListResponse {
  brands: Brand[];
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Provider = 'openai' | 'gemini' | 'qwen';

export type QwenModel = 'qwen-image-2.1-pro' | 'qwen-image-2.1-turbo';

export interface ProviderKey {
  id: string;
  provider: Provider;
  label: string | null;
  key_hint: string | null;
  is_active: boolean;
  is_valid: boolean | null;
  last_validated_at: string | null;
  last_validation_error: string | null;
  created_at: string;
}

export interface AddKeyRequest {
  provider: Provider;
  key: string;
  label?: string;
  make_active: boolean;
}

export interface KeyListResponse {
  keys: ProviderKey[];
}

export interface ValidateKeyResponse {
  valid: boolean | null;
  validated_at: string | null;
  error: string | null;
  key_id: string;
}

export type Tone = 'formal' | 'casual' | 'playful' | 'professional' | 'friendly';

export interface KitAnswers {
  tagline: string | null;
  tone: Tone | null;
  audience: string | null;
  colors: string[];
  avoid_words: string | null;
}

export interface UpsertKitRequest {
  answers: KitAnswers;
}

export interface KitResponse {
  brand_id: string;
  brand_name: string;
  answers: KitAnswers;
  summary: string | null;
  status: KitStatus;
  completed_at: string | null;
  updated_at: string;
}

export type PlatformPreset =
  | 'instagram_post'
  | 'instagram_story'
  | 'instagram_reel_cover'
  | 'facebook_post'
  | 'facebook_cover'
  | 'facebook_story'
  | 'twitter_post'
  | 'twitter_header'
  | 'linkedin_post'
  | 'linkedin_banner'
  | 'tiktok_video_cover'
  | 'youtube_thumbnail'
  | 'youtube_banner';

export type LogoMode = 'none' | 'prompt' | 'watermark' | 'both';

export type GenerationStatus = 'pending' | 'processing' | 'succeeded' | 'failed';

export interface GenerateRequest {
  prompt: string;
  provider: Provider;
  model?: string;
  platform_preset: PlatformPreset;
  logo_mode?: LogoMode;
  include_brand_context?: boolean;
}

export interface GenerationResponse {
  id: string;
  brand_id: string;
  prompt: string;
  provider: Provider;
  model: string;
  platform_preset: PlatformPreset;
  width: number;
  height: number;
  logo_mode: LogoMode;
  status: GenerationStatus;
  image_url?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface PagedGenerationsResponse {
  items: GenerationResponse[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminStatsResponse {
  total_brands: number;
  total_users: number;
  total_generations: number;
  succeeded_generations: number;
  failed_generations: number;
  openai_generations: number;
  gemini_generations: number;
  qwen_generations?: number;
  active_openai_keys: number;
  active_gemini_keys: number;
  active_qwen_keys?: number;
  success_rate: number;
}

export interface AdminBrandItem {
  id: string;
  owner_user_id: string;
  name: string;
  logo_url?: string | null;
  kit_status: string;
  total_generations: number;
  succeeded_generations: number;
  active_keys_count: number;
  created_at: string;
}

export interface AdminBrandsResponse {
  items: AdminBrandItem[];
  total_count: number;
}





