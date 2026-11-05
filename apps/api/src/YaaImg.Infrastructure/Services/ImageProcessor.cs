using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using YaaImg.Application.Interfaces;

namespace YaaImg.Infrastructure.Services;

public class ImageProcessor : IImageProcessor
{
    public byte[] ResizeToPreset(byte[] imageBytes, int targetWidth, int targetHeight)
    {
        using var image = Image.Load(imageBytes);

        // Scale to cover target dimensions and center-crop to exact pixel size
        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(targetWidth, targetHeight),
            Mode = ResizeMode.Crop,
            Position = AnchorPositionMode.Center
        }));

        using var ms = new MemoryStream();
        image.SaveAsPng(ms);
        return ms.ToArray();
    }

    public byte[] ApplyWatermark(
        byte[] imageBytes,
        byte[] logoBytes,
        float opacity = 0.7f,
        float scale = 0.15f,
        int margin = 20)
    {
        using var image = Image.Load(imageBytes);
        using var logo = Image.Load(logoBytes);

        // Scale watermark proportionally based on image width
        var logoTargetWidth = (int)(image.Width * scale);
        if (logoTargetWidth < 32) logoTargetWidth = 32;

        var logoScaleRatio = (float)logoTargetWidth / logo.Width;
        var logoTargetHeight = (int)(logo.Height * logoScaleRatio);

        logo.Mutate(ctx => ctx.Resize(logoTargetWidth, logoTargetHeight));

        // Position in bottom-right corner with margin
        var x = image.Width - logoTargetWidth - margin;
        var y = image.Height - logoTargetHeight - margin;

        if (x < 0) x = margin;
        if (y < 0) y = margin;

        image.Mutate(ctx => ctx.DrawImage(logo, new Point(x, y), opacity));

        using var ms = new MemoryStream();
        image.SaveAsPng(ms);
        return ms.ToArray();
    }
}
