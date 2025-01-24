from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os
import base64
import uuid

app = FastAPI()

# Create templates directory if not exists
os.makedirs("templates", exist_ok=True)

# Set up Jinja2 environment with datetime filter
from datetime import datetime
env = Environment(loader=FileSystemLoader("templates"))
env.filters['datetime'] = lambda dt: dt.strftime('%Y-%m-%d %H:%M:%S')

class TestStep(BaseModel):
    action: str
    screenshot: str  # Base64 encoded image

@app.post("/generate-pdf")
async def generate_pdf(steps: list[TestStep]):
    try:
        # Create context for template
        context = {
            "steps": [
                {
                    "number": idx + 1,
                    "action": step.action,
                    "screenshot": f"data:image/png;base64,{step.screenshot}"
                }
                for idx, step in enumerate(steps)
            ]
        }

        # Render HTML template
        template = env.get_template("report_template.html")
        html_content = template.render(context=context)

        # Generate PDF
        pdf_file = f"qa_report_{uuid.uuid4().hex[:6]}.pdf"
        HTML(string=html_content).write_pdf(pdf_file)

        return FileResponse(
            pdf_file,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={pdf_file}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
