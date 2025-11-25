from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.user import Base

class Game(Base):
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Game settings
    difficulty = Column(String, default="medium")  # easy, medium, hard
    status = Column(String, default="active")  # active, completed, abandoned
    
    # Game state
    current_location = Column(String, default="start")
    game_state = Column(JSON, default=dict)  # Stores entire game state
    
    # Stats
    score = Column(Integer, default=0)
    moves_count = Column(Integer, default=0)
    
    # Timestamps
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="games")
