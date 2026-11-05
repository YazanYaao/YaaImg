namespace YaaImg.Application.Common;

public record PresetInfo(
    string Key,
    string Platform,
    string Label,
    int Width,
    int Height,
    string AspectRatio);

public static class PlatformPresets
{
    private static readonly Dictionary<string, PresetInfo> Presets = new(StringComparer.OrdinalIgnoreCase)
    {
        // Instagram
        ["instagram_post"] = new("instagram_post", "Instagram", "Instagram Post", 1080, 1080, "1:1"),
        ["instagram_story"] = new("instagram_story", "Instagram", "Instagram Story", 1080, 1920, "9:16"),
        ["instagram_reel_cover"] = new("instagram_reel_cover", "Instagram", "Instagram Reel Cover", 1080, 1920, "9:16"),

        // Facebook
        ["facebook_post"] = new("facebook_post", "Facebook", "Facebook Post", 1200, 630, "16:9"),
        ["facebook_cover"] = new("facebook_cover", "Facebook", "Facebook Cover", 820, 312, "16:9"),
        ["facebook_story"] = new("facebook_story", "Facebook", "Facebook Story", 1080, 1920, "9:16"),

        // Twitter / X
        ["twitter_post"] = new("twitter_post", "Twitter", "X / Twitter Post", 1200, 675, "16:9"),
        ["twitter_header"] = new("twitter_header", "Twitter", "X / Twitter Header", 1500, 500, "16:9"),

        // LinkedIn
        ["linkedin_post"] = new("linkedin_post", "LinkedIn", "LinkedIn Post", 1200, 627, "16:9"),
        ["linkedin_banner"] = new("linkedin_banner", "LinkedIn", "LinkedIn Banner", 1584, 396, "16:9"),

        // TikTok
        ["tiktok_video_cover"] = new("tiktok_video_cover", "TikTok", "TikTok Video Cover", 1080, 1920, "9:16"),

        // YouTube
        ["youtube_thumbnail"] = new("youtube_thumbnail", "YouTube", "YouTube Thumbnail", 1280, 720, "16:9"),
        ["youtube_banner"] = new("youtube_banner", "YouTube", "YouTube Banner", 2560, 1440, "16:9"),
    };

    public static PresetInfo? Get(string presetKey) =>
        Presets.TryGetValue(presetKey, out var preset) ? preset : null;

    public static bool IsValid(string presetKey) => Presets.ContainsKey(presetKey);

    public static string GetQwenResolution(string presetKey) => presetKey switch
    {
        "instagram_post" => "1024*1024",
        "instagram_story" or "instagram_reel_cover" or "facebook_story" or "tiktok_video_cover" => "1152*2048",
        "facebook_post" or "linkedin_post" => "1536*800",
        "facebook_cover" => "1536*584",
        "twitter_post" or "youtube_thumbnail" => "1536*864",
        "twitter_header" => "1536*512",
        "linkedin_banner" => "1536*384",
        "youtube_banner" => "2048*1152",
        _ => "1024*1024"
    };

    public static IReadOnlyDictionary<string, PresetInfo> All => Presets;
}
