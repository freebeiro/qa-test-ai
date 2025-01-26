from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

print("Loading UI-TARS model...")
model_path = "../ui-tars-7b-dpo"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=torch.float16,
    device_map="auto"
)

class ChatRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]

def format_dom_for_model(dom_content: str) -> str:
    """Format DOM content for UI-TARS model input"""
    return f"""
DOM Structure:
{dom_content}
"""

def generate_action_plan(instruction: str, dom_content: str = None) -> Dict:
    """Generate UI action plan using UI-TARS model"""
    prompt = f"""Task: {instruction}\n"""
    if dom_content:
        prompt += format_dom_for_model(dom_content)
    
    prompt += "\nGenerate a detailed action plan:"

    # Generate response from model
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(
        **inputs,
        max_length=500,
        temperature=0.1,
        do_sample=True,
        num_return_sequences=1
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    try:
        # Extract JSON plan
        plan_start = response.find('{')
        plan_end = response.rfind('}') + 1
        plan_json = response[plan_start:plan_end]
        
        # Parse and validate action plan
        plan = json.loads(plan_json)
        return {
            "actions": plan.get("actions", []),
            "elements": plan.get("elements", [])
        }
    except Exception as e:
        print(f"Error parsing model output: {e}")
        print(f"Raw output: {response}")
        return {"error": "Could not generate action plan"}

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    try:
        # Extract instruction and DOM content
        message = request.messages[-1]
        instruction = message["content"][0].get("text", "")
        dom_content = message["content"][1].get("dom", "") if len(message["content"]) > 1 else None
        
        # Generate action plan using UI-TARS
        action_plan = generate_action_plan(instruction, dom_content)
        
        return {
            "choices": [{
                "message": {
                    "content": json.dumps(action_plan)
                }
            }]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)