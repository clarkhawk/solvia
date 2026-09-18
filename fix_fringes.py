from PIL import Image, ImageFilter

def erode_alpha(img_path, out_path, erode_amount=1):
    img = Image.open(img_path).convert("RGBA")
    
    # Split into bands
    r, g, b, a = img.split()
    
    # Erode the alpha channel by taking the minimum in a 3x3 neighborhood
    # Repeating this `erode_amount` times
    for _ in range(erode_amount):
        a = a.filter(ImageFilter.MinFilter(3))
    
    # Optionally, we can also blur the alpha channel slightly for anti-aliasing
    a = a.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    # Merge back
    img_fixed = Image.merge("RGBA", (r, g, b, a))
    img_fixed.save(out_path, "PNG")

# Let's try 1 pixel erosion and a tiny blur
erode_alpha('public/images/illustration_decoupee_transparente.png', 'public/images/illustration_decoupee_transparente_fixed.png', erode_amount=1)
