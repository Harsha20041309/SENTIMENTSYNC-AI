from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class Conversation(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False, default="New Conversation")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_pinned = db.Column(db.Boolean, default=False)
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "is_pinned": self.is_pinned
        }

class Message(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversation.id'), nullable=False)
    role = db.Column(db.String(10), nullable=False) # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(20)) # 'positive', 'negative', 'neutral'
    sentiment_score = db.Column(db.Float)
    confidence = db.Column(db.Float, default=0.95)
    suggested_response = db.Column(db.Text)
    priority = db.Column(db.String(10)) # 'High', 'Medium', 'Low'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "sentiment": self.sentiment,
            "sentiment_score": self.sentiment_score,
            "confidence": self.confidence,
            "suggested_response": self.suggested_response,
            "priority": self.priority,
            "timestamp": self.timestamp.isoformat()
        }

class TeamMember(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    role = db.Column(db.String(20), default='Viewer') # 'Admin', 'Analyst', 'Viewer'
    status = db.Column(db.String(20), default='Active') # 'Active', 'Pending'
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "joined_at": self.joined_at.isoformat()
        }

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(255), nullable=False)
    user = db.Column(db.String(255), default="System")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "user": self.user,
            "timestamp": self.timestamp.isoformat()
        }
