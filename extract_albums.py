import pytesseract
from PIL import Image, ImageOps

# Set the path to tesseract (if needed)
pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

# Open the image
image_path = "IMG_0151.jpg"
img = Image.open(image_path)

# Preprocessing
img = ImageOps.grayscale(img)  # Convert to grayscale
img = img.point(lambda x: 0 if x < 140 else 255)  # Thresholding (adjust value if needed)

# Extract the text
text = pytesseract.image_to_string(img)

# Print the extracted text
print(text)