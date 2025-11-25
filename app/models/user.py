from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    # Game stats
    level = Column(Integer, default=1)
    experience = Column(Float, default=0)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    
    # Resources
    coins = Column(Integer, default=100)
    health = Column(Integer, default=100)
    max_health = Column(Integer, default=100)
    
    # Game state
    current_game_id = Column(Integer, nullable=True)
    last_active = Column(DateTime, default=func.now())
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
