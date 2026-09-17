from PIL import Image

def convert_dark_to_white(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # threshold for considering a pixel "dark blue/black"
    # The text is very dark blue
    for item in datas:
        # Check if it's dark and has low green/red (it's dark blue)
        # We know the 'S' is green and blue. The green is bright. The blue is bright.
        # The text "Solvia" is dark.
        r, g, b, a = item
        if a > 0 and r < 50 and g < 100 and b < 100:
            newData.append((255, 255, 255, a)) # turn to white
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(out_path, "PNG")

convert_dark_to_white('public/logo.png', 'public/logo_white_text.png')
