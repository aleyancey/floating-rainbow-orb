# app.py
from google.cloud import vision
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os

def detect_album(image_path):
    # Initialize Google Cloud Vision client
    client = vision.ImageAnnotatorClient()

    # Read the image file
    with open(image_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    # Perform both text detection and web detection
    text_response = client.text_detection(image=image)
    web_response = client.web_detection(image=image)

    # Extract text from the image
    texts = []
    if text_response.text_annotations:
        texts = [text.description for text in text_response.text_annotations]

    # Initialize Spotify client
    spotify = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
        client_id=os.getenv('SPOTIFY_CLIENT_ID'),
        client_secret=os.getenv('SPOTIFY_CLIENT_SECRET')
    ))

    # Search Spotify using detected text
    if texts:
        # Use the first (most prominent) text as search query
        results = spotify.search(q=texts[0], type='album', limit=5)
        if results['albums']['items']:
            return results['albums']['items']
    
    return None

def main():
    # Example usage
    image_path = 'path_to_your_album_image.jpg'
    results = detect_album(image_path)
    
    if results:
        print("Possible matches:")
        for album in results:
            print(f"Album: {album['name']}")
            print(f"Artist: {album['artists'][0]['name']}")
            print(f"Release Date: {album['release_date']}")
            print("---")
    else:
        print("No matches found")

if __name__ == "__main__":
    main()