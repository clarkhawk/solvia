from PIL import Image
img = Image.open('public/logo.png')
print(img.getpixel((0, 0)))
