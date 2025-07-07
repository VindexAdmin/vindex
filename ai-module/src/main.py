"""
VindexChain AI Module Suite
Market Predictor + Reputation Engine + ChatBot

Author: VindexChain Team
License: Apache 2.0
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
import openai
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import torch
import transformers
from prometheus_client import Counter, Histogram, generate_latest
import structlog

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Metrics
PREDICTION_REQUESTS = Counter('ai_prediction_requests_total', 'Total prediction requests')
REPUTATION_REQUESTS = Counter('ai_reputation_requests_total', 'Total reputation requests')
CHATBOT_REQUESTS = Counter('ai_chatbot_requests_total', 'Total chatbot requests')
PREDICTION_LATENCY = Histogram('ai_prediction_duration_seconds', 'Prediction request duration')
REPUTATION_LATENCY = Histogram('ai_reputation_duration_seconds', 'Reputation request duration')

# Initialize FastAPI app
app = FastAPI(
    title="VindexChain AI Module Suite",
    description="Market Predictions, Reputation Engine, and ChatBot for VindexChain",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Configuration
class Config:
    POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://vindex:password@localhost:5432/vindexchain")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    VINDEX_API_URL = os.getenv("VINDEX_API_URL", "http://localhost:1317")
    AI_MODEL_PREDICTOR = os.getenv("AI_MODEL_PREDICTOR", "mistral-7b")
    AI_MODEL_REPUTATION = os.getenv("AI_MODEL_REPUTATION", "bert-base")
    PREDICTION_CACHE_TTL = int(os.getenv("PREDICTION_CACHE_TTL", "300"))  # 5 minutes
    REPUTATION_CACHE_TTL = int(os.getenv("REPUTATION_CACHE_TTL", "3600"))  # 1 hour

config = Config()

# Initialize external services
redis_client = redis.from_url(config.REDIS_URL)
openai.api_key = config.OPENAI_API_KEY

# Database connection
def get_db_connection():
    return psycopg2.connect(config.POSTGRES_URL, cursor_factory=RealDictCursor)

# Pydantic models
class PredictionRequest(BaseModel):
    token_denom: str = Field(..., description="Token denomination (e.g., 'oc', 'usdc')")
    timeframe: str = Field("24h", description="Prediction timeframe (1h, 24h, 7d, 30d)")
    include_sentiment: bool = Field(True, description="Include sentiment analysis")

class PredictionResponse(BaseModel):
    token_denom: str
    current_price: float
    predicted_price: float
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")
    trend: str = Field(..., description="bullish, bearish, or neutral")
    volatility_score: float = Field(..., ge=0, le=100, description="Volatility score 0-100")
    sentiment_score: float = Field(..., ge=-1, le=1, description="Sentiment score -1 to 1")
    prediction_timestamp: datetime
    disclaimer: str = Field(default="This is not financial advice. Cryptocurrency investments are highly volatile.")

class ReputationRequest(BaseModel):
    address: str = Field(..., description="Wallet address to analyze")
    include_history: bool = Field(True, description="Include transaction history analysis")

class ReputationResponse(BaseModel):
    address: str
    reputation_score: int = Field(..., ge=0, le=100, description="Reputation score 0-100")
    risk_level: str = Field(..., description="low, medium, high")
    trust_indicators: List[str]
    warning_flags: List[str]
    transaction_count: int
    account_age_days: int
    last_activity: datetime
    color_code: str = Field(..., description="green, yellow, red")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    context: Optional[str] = Field(None, description="Additional context")
    language: str = Field("en", description="Response language (en, es)")

class ChatResponse(BaseModel):
    response: str
    confidence: float = Field(..., ge=0, le=1)
    sources: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)

# Market Predictor Service
class MarketPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.features = ['price', 'volume', 'market_cap', 'volatility', 'rsi', 'macd']
        
    async def load_model(self):
        """Load or train the prediction model"""
        try:
            # In production, load pre-trained model
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            logger.info("Market prediction model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load prediction model: {e}")
            
    async def get_market_data(self, token_denom: str, timeframe: str) -> pd.DataFrame:
        """Fetch market data for the token"""
        try:
            # Simulate market data - in production, fetch from real APIs
            dates = pd.date_range(end=datetime.now(), periods=100, freq='1H')
            data = {
                'timestamp': dates,
                'price': np.random.uniform(0.5, 2.0, 100),
                'volume': np.random.uniform(1000, 10000, 100),
                'market_cap': np.random.uniform(100000, 1000000, 100),
                'volatility': np.random.uniform(0.1, 0.5, 100),
                'rsi': np.random.uniform(20, 80, 100),
                'macd': np.random.uniform(-0.1, 0.1, 100)
            }
            return pd.DataFrame(data)
        except Exception as e:
            logger.error(f"Failed to fetch market data: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch market data")
    
    async def predict_price(self, request: PredictionRequest) -> PredictionResponse:
        """Generate price prediction"""
        PREDICTION_REQUESTS.inc()
        
        with PREDICTION_LATENCY.time():
            try:
                # Get market data
                market_data = await self.get_market_data(request.token_denom, request.timeframe)
                
                # Prepare features
                features = market_data[self.features].fillna(0)
                
                # Make prediction (simplified)
                current_price = market_data['price'].iloc[-1]
                predicted_change = np.random.uniform(-0.2, 0.2)  # ±20% change
                predicted_price = current_price * (1 + predicted_change)
                
                # Calculate confidence and volatility
                volatility = market_data['volatility'].mean() * 100
                confidence = max(0.1, 1.0 - (volatility / 100))
                
                # Determine trend
                if predicted_change > 0.05:
                    trend = "bullish"
                elif predicted_change < -0.05:
                    trend = "bearish"
                else:
                    trend = "neutral"
                
                # Sentiment analysis (simplified)
                sentiment_score = np.random.uniform(-0.5, 0.5)
                
                return PredictionResponse(
                    token_denom=request.token_denom,
                    current_price=current_price,
                    predicted_price=predicted_price,
                    confidence=confidence,
                    trend=trend,
                    volatility_score=volatility,
                    sentiment_score=sentiment_score,
                    prediction_timestamp=datetime.now()
                )
                
            except Exception as e:
                logger.error(f"Prediction failed: {e}")
                raise HTTPException(status_code=500, detail="Prediction failed")

# Reputation Engine Service
class ReputationEngine:
    def __init__(self):
        self.risk_thresholds = {
            'low': 70,
            'medium': 40,
            'high': 0
        }
        
    async def analyze_address(self, request: ReputationRequest) -> ReputationResponse:
        """Analyze address reputation"""
        REPUTATION_REQUESTS.inc()
        
        with REPUTATION_LATENCY.time():
            try:
                # Check cache first
                cache_key = f"reputation:{request.address}"
                cached = redis_client.get(cache_key)
                if cached:
                    return ReputationResponse.parse_raw(cached)
                
                # Fetch transaction history
                tx_history = await self.get_transaction_history(request.address)
                
                # Calculate reputation score
                score = await self.calculate_reputation_score(request.address, tx_history)
                
                # Determine risk level
                risk_level = self.get_risk_level(score)
                
                # Get trust indicators and warnings
                trust_indicators = await self.get_trust_indicators(request.address, tx_history)
                warning_flags = await self.get_warning_flags(request.address, tx_history)
                
                # Color coding
                color_code = "green" if score >= 70 else "yellow" if score >= 40 else "red"
                
                response = ReputationResponse(
                    address=request.address,
                    reputation_score=score,
                    risk_level=risk_level,
                    trust_indicators=trust_indicators,
                    warning_flags=warning_flags,
                    transaction_count=len(tx_history),
                    account_age_days=await self.get_account_age(request.address),
                    last_activity=datetime.now(),
                    color_code=color_code
                )
                
                # Cache result
                redis_client.setex(cache_key, config.REPUTATION_CACHE_TTL, response.json())
                
                return response
                
            except Exception as e:
                logger.error(f"Reputation analysis failed: {e}")
                raise HTTPException(status_code=500, detail="Reputation analysis failed")
    
    async def get_transaction_history(self, address: str) -> List[Dict]:
        """Fetch transaction history for address"""
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT * FROM transactions 
                        WHERE sender = %s OR recipient = %s 
                        ORDER BY timestamp DESC 
                        LIMIT 1000
                    """, (address, address))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Failed to fetch transaction history: {e}")
            return []
    
    async def calculate_reputation_score(self, address: str, tx_history: List[Dict]) -> int:
        """Calculate reputation score based on various factors"""
        score = 50  # Base score
        
        # Transaction volume factor
        if len(tx_history) > 100:
            score += 10
        elif len(tx_history) > 50:
            score += 5
        
        # Account age factor
        account_age = await self.get_account_age(address)
        if account_age > 365:
            score += 15
        elif account_age > 90:
            score += 10
        elif account_age > 30:
            score += 5
        
        # Diversity factor (different counterparties)
        unique_counterparties = len(set([tx.get('sender', '') for tx in tx_history] + 
                                      [tx.get('recipient', '') for tx in tx_history]))
        if unique_counterparties > 50:
            score += 10
        elif unique_counterparties > 20:
            score += 5
        
        # Regular activity factor
        recent_activity = len([tx for tx in tx_history 
                             if datetime.fromisoformat(tx.get('timestamp', '2020-01-01')) > 
                             datetime.now() - timedelta(days=30)])
        if recent_activity > 10:
            score += 5
        
        return min(100, max(0, score))
    
    def get_risk_level(self, score: int) -> str:
        """Determine risk level based on score"""
        if score >= self.risk_thresholds['low']:
            return "low"
        elif score >= self.risk_thresholds['medium']:
            return "medium"
        else:
            return "high"
    
    async def get_trust_indicators(self, address: str, tx_history: List[Dict]) -> List[str]:
        """Get positive trust indicators"""
        indicators = []
        
        if len(tx_history) > 100:
            indicators.append("High transaction volume")
        
        if await self.get_account_age(address) > 365:
            indicators.append("Established account (>1 year)")
        
        # Check for validator activity
        if await self.is_validator(address):
            indicators.append("Network validator")
        
        # Check for token creation
        if await self.has_created_tokens(address):
            indicators.append("Token creator")
        
        return indicators
    
    async def get_warning_flags(self, address: str, tx_history: List[Dict]) -> List[str]:
        """Get warning flags"""
        warnings = []
        
        # Check for suspicious patterns
        if await self.has_suspicious_patterns(address, tx_history):
            warnings.append("Suspicious transaction patterns detected")
        
        # Check OFAC list
        if await self.is_ofac_sanctioned(address):
            warnings.append("Address appears on OFAC sanctions list")
        
        # Check for high-risk interactions
        if await self.has_high_risk_interactions(address, tx_history):
            warnings.append("Interactions with high-risk addresses")
        
        return warnings
    
    async def get_account_age(self, address: str) -> int:
        """Get account age in days"""
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT MIN(timestamp) FROM transactions 
                        WHERE sender = %s OR recipient = %s
                    """, (address, address))
                    result = cur.fetchone()
                    if result and result[0]:
                        first_tx = datetime.fromisoformat(result[0])
                        return (datetime.now() - first_tx).days
            return 0
        except Exception:
            return 0
    
    async def is_validator(self, address: str) -> bool:
        """Check if address is a validator"""
        # Implementation would check validator set
        return False
    
    async def has_created_tokens(self, address: str) -> bool:
        """Check if address has created tokens"""
        # Implementation would check token factory transactions
        return False
    
    async def has_suspicious_patterns(self, address: str, tx_history: List[Dict]) -> bool:
        """Check for suspicious transaction patterns"""
        # Implementation would analyze patterns like structuring, etc.
        return False
    
    async def is_ofac_sanctioned(self, address: str) -> bool:
        """Check OFAC sanctions list"""
        # Implementation would check against OFAC API
        return False
    
    async def has_high_risk_interactions(self, address: str, tx_history: List[Dict]) -> bool:
        """Check for interactions with high-risk addresses"""
        # Implementation would check counterparty risk scores
        return False

# ChatBot Service
class ChatBot:
    def __init__(self):
        self.system_prompt = """
        You are VindexBot, the official AI assistant for VindexChain - The First Blockchain of Puerto Rico.
        
        You help users with:
        - Understanding VindexChain features and capabilities
        - Navigating the ecosystem (VindexWallet, VindexScan, BurnSwap)
        - Token creation and domain registration
        - Staking and governance participation
        - General blockchain and DeFi education
        
        Always be helpful, accurate, and emphasize security best practices.
        Respond in the user's preferred language (English or Spanish).
        Include relevant links and suggest specific actions when appropriate.
        """
        
    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """Process chat message and generate response"""
        CHATBOT_REQUESTS.inc()
        
        try:
            # Prepare context
            context = self.build_context(request.context)
            
            # Generate response using OpenAI
            if config.OPENAI_API_KEY:
                response_text = await self.generate_openai_response(request.message, context, request.language)
            else:
                response_text = await self.generate_fallback_response(request.message, request.language)
            
            # Extract suggested actions
            suggested_actions = self.extract_suggested_actions(request.message)
            
            # Get relevant sources
            sources = self.get_relevant_sources(request.message)
            
            return ChatResponse(
                response=response_text,
                confidence=0.85,
                sources=sources,
                suggested_actions=suggested_actions
            )
            
        except Exception as e:
            logger.error(f"ChatBot processing failed: {e}")
            return ChatResponse(
                response="I'm sorry, I'm experiencing technical difficulties. Please try again later.",
                confidence=0.0,
                sources=[],
                suggested_actions=[]
            )
    
    def build_context(self, additional_context: Optional[str]) -> str:
        """Build context for the conversation"""
        base_context = """
        VindexChain Information:
        - Native token: OC$ (OneChance) with 9 decimals
        - TPS: 65,000+ transactions per second
        - Block time: 3 seconds
        - Consensus: Proof of Stake
        - Address prefix: vindex
        - Chain ID: vindexchain-1
        
        Ecosystem Components:
        - VindexWallet: Browser extension and mobile wallet
        - VindexScan: Block explorer and analytics
        - BurnSwap: Native DEX with auto-burn mechanism
        - Token Factory: No-code token creation
        - Domain System: .vindex Web3 domains
        """
        
        if additional_context:
            return f"{base_context}\n\nAdditional Context: {additional_context}"
        
        return base_context
    
    async def generate_openai_response(self, message: str, context: str, language: str) -> str:
        """Generate response using OpenAI API"""
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"{self.system_prompt}\n\nContext: {context}"},
                    {"role": "user", "content": f"Language: {language}\nMessage: {message}"}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return await self.generate_fallback_response(message, language)
    
    async def generate_fallback_response(self, message: str, language: str) -> str:
        """Generate fallback response when OpenAI is unavailable"""
        responses = {
            "en": {
                "default": "Thank you for your question about VindexChain. For detailed information, please visit our documentation at docs.vindexchain.com or explore our ecosystem at vindexchain.com.",
                "wallet": "VindexWallet is our secure browser extension and mobile app for managing your OC$ tokens and interacting with the VindexChain ecosystem.",
                "staking": "You can stake your OC$ tokens to help secure the network and earn rewards. Visit VindexWallet to start staking.",
                "dex": "BurnSwap is our native DEX where you can trade tokens with ultra-low fees and benefit from our auto-burn mechanism."
            },
            "es": {
                "default": "Gracias por tu pregunta sobre VindexChain. Para información detallada, visita nuestra documentación en docs.vindexchain.com o explora nuestro ecosistema en vindexchain.com.",
                "wallet": "VindexWallet es nuestra extensión de navegador y aplicación móvil segura para gestionar tus tokens OC$ e interactuar con el ecosistema VindexChain.",
                "staking": "Puedes hacer staking de tus tokens OC$ para ayudar a asegurar la red y ganar recompensas. Visita VindexWallet para comenzar.",
                "dex": "BurnSwap es nuestro DEX nativo donde puedes intercambiar tokens con comisiones ultra bajas y beneficiarte de nuestro mecanismo de quema automática."
            }
        }
        
        lang_responses = responses.get(language, responses["en"])
        
        # Simple keyword matching
        message_lower = message.lower()
        if any(word in message_lower for word in ["wallet", "billetera"]):
            return lang_responses["wallet"]
        elif any(word in message_lower for word in ["staking", "stake"]):
            return lang_responses["staking"]
        elif any(word in message_lower for word in ["dex", "swap", "trade", "intercambio"]):
            return lang_responses["dex"]
        else:
            return lang_responses["default"]
    
    def extract_suggested_actions(self, message: str) -> List[str]:
        """Extract suggested actions based on message content"""
        actions = []
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["wallet", "create", "setup"]):
            actions.append("Download VindexWallet extension")
        
        if any(word in message_lower for word in ["stake", "staking", "rewards"]):
            actions.append("Start staking in VindexWallet")
        
        if any(word in message_lower for word in ["trade", "swap", "dex"]):
            actions.append("Visit BurnSwap DEX")
        
        if any(word in message_lower for word in ["token", "create", "factory"]):
            actions.append("Use Token Factory")
        
        if any(word in message_lower for word in ["domain", "register", ".vindex"]):
            actions.append("Register .vindex domain")
        
        return actions
    
    def get_relevant_sources(self, message: str) -> List[str]:
        """Get relevant documentation sources"""
        sources = ["https://docs.vindexchain.com"]
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["wallet"]):
            sources.append("https://docs.vindexchain.com/wallet")
        
        if any(word in message_lower for word in ["staking"]):
            sources.append("https://docs.vindexchain.com/staking")
        
        if any(word in message_lower for word in ["dex", "swap"]):
            sources.append("https://docs.vindexchain.com/burnswap")
        
        return sources

# Initialize services
market_predictor = MarketPredictor()
reputation_engine = ReputationEngine()
chatbot = ChatBot()

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await market_predictor.load_model()
    logger.info("VindexChain AI Module Suite started successfully")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "market_predictor": "online",
            "reputation_engine": "online",
            "chatbot": "online"
        }
    }

@app.post("/api/v1/predict", response_model=PredictionResponse)
async def predict_market(request: PredictionRequest):
    """Generate market prediction"""
    return await market_predictor.predict_price(request)

@app.post("/api/v1/reputation", response_model=ReputationResponse)
async def analyze_reputation(request: ReputationRequest):
    """Analyze address reputation"""
    return await reputation_engine.analyze_address(request)

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    """Chat with VindexBot"""
    return await chatbot.process_message(request)

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )