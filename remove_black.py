from PIL import Image

def remove_black(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # threshold for considering a pixel "black background"
    for item in datas:
        # Check if r, g, b are close to black
        if item[0] < 20 and item[1] < 20 and item[2] < 20:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(out_path, "PNG")

remove_black('public/logo.png', 'public/logo_transparent.png')
