from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class ChatRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    try:
        text = request.messages[-1]["content"][0]["text"]
        
        action = {"type": "navigate", "url": "https://google.pt"}
        if text.startswith("navigate to") or text.startswith("go to"):
            url = text.split()[-1]
            if not url.startswith("http"):
                url = f"https://{url}"
            action = {"type": "navigate", "url": url}
        
        return {
            "choices": [{
                "message": {
                    "content": json.dumps(action)
                }
            }]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))