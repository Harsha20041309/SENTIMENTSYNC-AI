from textblob import TextBlob
import random

def analyze_sentiment(text):
    blob = TextBlob(text)
    score = blob.sentiment.polarity
    
    # Simple confidence score simulation based on text length and polarity strength
    confidence = min(0.99, 0.7 + (abs(score) * 0.2) + (min(len(text), 100) / 1000))
    
    if score > 0.1:
        sentiment = 'positive'
        priority = 'Low'
    elif score < -0.1:
        sentiment = 'negative'
        priority = 'High'
    else:
        sentiment = 'neutral'
        priority = 'Medium'
        
    return sentiment, score, round(confidence, 2), priority

def generate_smart_response(text, sentiment):
    """
    Generates a response tailored to the user's detected sentiment.
    """
    responses = {
        'positive': [
            "I'm so glad to hear that! We really appreciate your positive feedback.",
            "That's wonderful! Thank you for sharing your experience with us.",
            "Great! Is there anything else I can help you with today?",
            "Happy to help! Your satisfaction is our top priority."
        ],
        'negative': [
            "I'm very sorry to hear that you're having trouble. I'm here to help you resolve this.",
            "I understand your frustration, and I apologize for any inconvenience caused.",
            "Thank you for bringing this to our attention. Let me look into this for you immediately.",
            "I hear you, and I'm committed to making this right. Could you tell me more about the issue?"
        ],
        'neutral': [
            "Thank you for your message. How can I assist you further?",
            "I've noted that. Is there anything specific you'd like to know?",
            "Understood. Please let me know if you have any questions.",
            "I'm here to help. What's on your mind?"
        ]
    }
    
    main_response = random.choice(responses[sentiment])
    
    suggestions = {
        'positive': "Offer a loyalty discount or request a review.",
        'negative': "Escalate to a human agent immediately.",
        'neutral': "Ask clarifying questions to better understand needs."
    }
    
    return main_response, suggestions[sentiment]
