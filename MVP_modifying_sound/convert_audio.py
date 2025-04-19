from pydub import AudioSegment

m4a_file = Users/aleyancey/Music/creek.m4a  # Replace with the actual path to your m4a file
wav_file = "path/to/your/output.wav"  # Replace with the desired path for your WAV file

try:
    sound = AudioSegment.from_file(m4a_file, format="m4a")
    sound.export(wav_file, format="wav")
    print(f"Successfully converted '{m4a_file}' to '{wav_file}'")
except FileNotFoundError:
    print(f"Error: The file '{m4a_file}' was not found.")
except Exception as e:
    print(f"An error occurred: {e}")