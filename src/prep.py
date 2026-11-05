from PIL import Image, ImageOps, ImageFilter
import glob, os

os.makedirs("out", exist_ok=True)

for path in glob.glob("*.jpg") + glob.glob("*.jpeg") + glob.glob("*.png"):
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")

    # Crop to 3:4 portrait around the middle, then resize to 800x1066
    img = ImageOps.fit(img, (800, 1066), Image.LANCZOS, centering=(0.5, 0.45))

    # Light sharpening to bring back detail lost in resizing
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=3))

    name = os.path.splitext(os.path.basename(path))[0] + ".jpg"
    img.save(os.path.join("out", name), "JPEG", quality=88, optimize=True, progressive=True)
    print("done", name)