from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import jinja2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFRequest(BaseModel):
    chat_history: List[Dict]

@app.post("/generate-pdf")
async def generate_pdf(request: PDFRequest):
    # Mock PDF response for testing
    return {"url": "http://localhost:8001/reports/test.pdf"}