from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Conversation, Message, TeamMember, ActivityLog
from sentiment_engine import analyze_sentiment, generate_smart_response
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"], "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]}})

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sentimentsync.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def log_activity(action, user="Admin"):
    try:
        log = ActivityLog(action=action, user=user)
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Failed to log activity: {e}")

with app.app_context():
    db.create_all()
    # Initialize some team members if empty
    if not TeamMember.query.first():
        db.session.add(TeamMember(name="Alex Rivers", email="alex@enterprise.ai", role="Admin"))
        db.session.add(TeamMember(name="Sarah Chen", email="sarah.c@enterprise.ai", role="Analyst"))
        db.session.commit()

@app.route('/api/test', methods=['GET'])
def test_cors():
    return jsonify({"message": "CORS working"})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    content = data.get('message')
    conversation_id = data.get('conversation_id')

    if not content:
        return jsonify({"error": "Message content is required"}), 400

    # Get or create conversation
    if not conversation_id:
        conversation = Conversation(title=content[:30] + "...")
        db.session.add(conversation)
        db.session.commit()
        conversation_id = conversation.id
        log_activity(f"Created session: {conversation.title}")
    else:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

    # Analyze user sentiment
    sentiment, score, confidence, priority = analyze_sentiment(content)
    main_resp, suggested = generate_smart_response(content, sentiment)

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role='user',
        content=content,
        sentiment=sentiment,
        sentiment_score=score,
        confidence=confidence,
        priority=priority,
        suggested_response=suggested
    )
    db.session.add(user_msg)

    # Save bot message
    bot_msg = Message(
        conversation_id=conversation_id,
        role='assistant',
        content=main_resp,
        sentiment=sentiment,
        sentiment_score=score
    )
    db.session.add(bot_msg)
    db.session.commit()

    return jsonify({
        "conversation_id": conversation_id,
        "user_message": user_msg.to_dict(),
        "bot_message": bot_msg.to_dict()
    })

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    conversations = Conversation.query.order_by(Conversation.is_pinned.desc(), Conversation.created_at.desc()).all()
    return jsonify([c.to_dict() for c in conversations])

@app.route('/api/conversations/<id>', methods=['GET', 'DELETE', 'PATCH'])
def handle_conversation(id):
    conversation = Conversation.query.get(id)
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    if request.method == 'GET':
        messages = Message.query.filter_by(conversation_id=id).order_by(Message.timestamp.asc()).all()
        return jsonify({
            "conversation": conversation.to_dict(),
            "messages": [m.to_dict() for m in messages]
        })
    
    if request.method == 'DELETE':
        db.session.delete(conversation)
        db.session.commit()
        log_activity(f"Deleted session: {id}")
        return jsonify({"success": True})
    
    if request.method == 'PATCH':
        data = request.json
        if 'is_pinned' in data:
            conversation.is_pinned = data['is_pinned']
        if 'title' in data:
            conversation.title = data['title']
        db.session.commit()
        return jsonify(conversation.to_dict())

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    messages = Message.query.filter_by(role='user').all()
    
    pos_count = len([m for m in messages if m.sentiment == 'positive'])
    neg_count = len([m for m in messages if m.sentiment == 'negative'])
    neu_count = len([m for m in messages if m.sentiment == 'neutral'])
    total = len(messages)
    
    # Calculate CSAT
    csat = (pos_count / total * 100) if total > 0 else 0
    
    # Generate weekly trend data
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    trend = []
    now = datetime.utcnow()
    for i in range(7):
        date = now - timedelta(days=6-i)
        day_messages = Message.query.filter(
            Message.role == 'user',
            db.func.date(Message.timestamp) == date.date()
        ).all()
        
        trend.append({
            "name": days[date.weekday()],
            "positive": len([m for m in day_messages if m.sentiment == 'positive']),
            "negative": len([m for m in day_messages if m.sentiment == 'negative']),
            "neutral": len([m for m in day_messages if m.sentiment == 'neutral']),
            "total": len(day_messages)
        })

    return jsonify({
        "positive": pos_count,
        "negative": neg_count,
        "neutral": neu_count,
        "total": total,
        "csat": round(csat, 1),
        "avg_confidence": round(sum([m.confidence for m in messages]) / total, 2) if total > 0 else 0,
        "weekly_trend": trend
    })

@app.route('/api/team', methods=['GET', 'POST'])
def handle_team():
    if request.method == 'GET':
        members = TeamMember.query.all()
        return jsonify([m.to_dict() for m in members])
    
    if request.method == 'POST':
        data = request.json
        member = TeamMember(
            name=data.get('name'),
            email=data.get('email'),
            role=data.get('role', 'Viewer')
        )
        db.session.add(member)
        db.session.commit()
        log_activity(f"Invited member: {member.email}")
        return jsonify(member.to_dict()), 201

@app.route('/api/team/<id>', methods=['DELETE'])
def delete_member(id):
    member = TeamMember.query.get(id)
    if member:
        db.session.delete(member)
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"error": "Not found"}), 404

@app.route('/api/activity', methods=['GET'])
def get_activity():
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(50).all()
    return jsonify([l.to_dict() for l in logs])

@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    # Placeholder for CSV analysis
    log_activity("Uploaded dataset for analysis")
    return jsonify({
        "success": True, 
        "summary": "Dataset analyzed: 124 records processed. Overall sentiment: Positive (62%).",
        "positive": 77,
        "negative": 15,
        "neutral": 32
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
