from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    temperature: float = 0.1
    max_tokens: int = 1000

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    return {
        "choices": [{
            "message": {
                "content": "Instructions processed. Capturing screenshot."
            }
        }]
    }