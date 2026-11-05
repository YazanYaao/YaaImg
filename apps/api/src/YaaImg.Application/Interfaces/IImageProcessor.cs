namespace YaaImg.Application.Interfaces;

public interface IImageProcessor
{
    byte[] ResizeToPreset(byte[] imageBytes, int targetWidth, int targetHeight);
    byte[] ApplyWatermark(byte[] imageBytes, byte[] logoBytes, float opacity = 0.7f, float scale = 0.15f, int margin = 20);
}
