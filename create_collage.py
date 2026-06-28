from PIL import Image

def crop_center(img, target_w, target_h):
    w, h = img.size
    aspect = w / h
    target_aspect = target_w / target_h

    if aspect > target_aspect:
        new_w = int(h * target_aspect)
        new_h = h
        left = (w - new_w) / 2
        top = 0
        right = left + new_w
        bottom = h
    else:
        new_w = w
        new_h = int(w / target_aspect)
        left = 0
        top = (h - new_h) / 2
        right = w
        bottom = top + new_h

    img = img.crop((left, top, right, bottom))
    return img.resize((target_w, target_h), Image.LANCZOS)

files = [
    r"C:\Users\Sanmeet\.gemini\antigravity\brain\0649fb6f-56cb-4945-be3a-b67399e4c4ab\media__1782613454509.jpg",
    r"C:\Users\Sanmeet\.gemini\antigravity\brain\0649fb6f-56cb-4945-be3a-b67399e4c4ab\media__1782613454521.jpg",
    r"C:\Users\Sanmeet\.gemini\antigravity\brain\0649fb6f-56cb-4945-be3a-b67399e4c4ab\media__1782613454526.jpg",
    r"C:\Users\Sanmeet\.gemini\antigravity\brain\0649fb6f-56cb-4945-be3a-b67399e4c4ab\media__1782613454650.jpg"
]

images = [Image.open(f) for f in files]

canvas_w, canvas_h = 1920, 1080
cell_w, cell_h = 960, 540

collage = Image.new('RGB', (canvas_w, canvas_h))

positions = [
    (0, 0),
    (cell_w, 0),
    (0, cell_h),
    (cell_w, cell_h)
]

for i, img in enumerate(images):
    processed_img = crop_center(img, cell_w, cell_h)
    collage.paste(processed_img, positions[i])

collage.save('nsg-header-bg.jpg', quality=95)
print("Collage created successfully!")
