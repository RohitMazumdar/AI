from langdetect import detect, detect_langs
from langdetect.lang_detect_exception import LangDetectException

def detect_language(text):
    """
    Detects the language of the given text.
    
    Parameters:
        text (str): The input text for language detection.
    
    Returns:
        str: The detected language code.
        list: Probabilities of detected languages.
    """
    try:
        # Detect the language code
        language_code = detect(text)
        
        # Detect languages with probabilities
        probable_languages = detect_langs(text)
        
        return language_code, probable_languages
    
    except LangDetectException:
        return "Could not detect the language.", []

if __name__ == "__main__":
    text = input("Enter text to detect language: ")
    language_code, probable_languages = detect_language(text)
    
    print(f"Detected language code: {language_code}")
    print("Probabilities:")
    for lang in probable_languages:
        print(f"  {lang}")
