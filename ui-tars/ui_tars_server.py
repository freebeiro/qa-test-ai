from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import torch
import json
import os
from transformers import AutoConfig, AutoModelForVision2Seq, AutoTokenizer, AutoProcessor
from PIL import Image
import base64
import io
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Model initialization with proper error handling
def initialize_model():
    model_path = "/models/ui-tars-7b-dpo"
    logger.info(f"Initializing UI-TARS model from {model_path}")

    try:
        # Load configuration
        config = AutoConfig.from_pretrained(
            model_path,
            trust_remote_code=True
        )
        logger.info("Configuration loaded successfully")

        # Load tokenizer with special token handling
        tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            trust_remote_code=True
        )
        logger.info("Tokenizer loaded successfully")

        # Load image processor
        processor = AutoProcessor.from_pretrained(
            model_path,
            trust_remote_code=True
        )
        logger.info("Processor loaded successfully")

        # Initialize model with proper configuration
        model = AutoModelForVision2Seq.from_pretrained(
            model_path,
            config=config,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
        model.eval()
        logger.info("Model loaded successfully")

        return model, tokenizer, processor

    except Exception as e:
        logger.error(f"Error initializing model: {str(e)}")
        if os.path.exists(model_path):
            logger.error(f"Model directory contents: {os.listdir(model_path)}")
        raise

# Initialize model components
model, tokenizer, processor = initialize_model()

class ChatRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    max_tokens: Optional[int] = 500
    temperature: Optional[float] = 0.1

def preprocess_image(image_data: str) -> Image.Image:
    """Convert base64 screenshot to PIL Image with error handling"""
    try:
        image_bytes = base64.b64decode(image_data)
        return Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise ValueError("Invalid image data")

def generate_response(instruction: str, screenshot: Optional[str] = None) -> Dict:
    """Generate UI interaction plan using UI-TARS model"""
    try:
        # Prepare the instruction prompt
        prompt = f"Based on the webpage shown, {instruction}"
        
        # Prepare inputs for the model
        inputs = {
            "text": tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True
            ).to(model.device)
        }

        # Process screenshot if provided
        if screenshot:
            image = preprocess_image(screenshot)
            image_inputs = processor(images=image, return_tensors="pt").to(model.device)
            inputs.update(image_inputs)

        # Generate response with the model
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=500,
                temperature=0.1,
                do_sample=True,
                num_return_sequences=1
            )

        # Decode and process the response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"Generated response: {response[:100]}...")  # Log first 100 chars

        # Extract and validate the JSON plan
        try:
            plan_start = response.find('{')
            plan_end = response.rfind('}') + 1
            if plan_start == -1 or plan_end <= plan_start:
                raise ValueError("No valid JSON found in response")

            plan_json = response[plan_start:plan_end]
            plan = json.loads(plan_json)

            return {
                "actions": plan.get("actions", []),
                "elements": plan.get("elements", []),
                "understanding": plan.get("understanding", ""),
                "verification": plan.get("verification", [])
            }
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            logger.error(f"Response text: {response}")
            raise ValueError("Invalid response format")

    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return {"error": str(e)}

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    try:
        # Extract the latest message
        message = request.messages[-1]
        instruction = message["content"][0].get("text", "")
        screenshot = message["content"][1].get("screenshot", None) if len(message["content"]) > 1 else None

        # Generate the interaction plan
        plan = generate_response(instruction, screenshot)

        return {
            "choices": [{
                "message": {
                    "content": json.dumps(plan)
                }
            }]
        }
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Verify model components are loaded
        if not all([model, tokenizer, processor]):
            raise Exception("One or more model components not initialized")
        return {"status": "healthy", "model": "loaded"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
