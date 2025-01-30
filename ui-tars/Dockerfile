# Start with Python 3.9 slim image which works across platforms
FROM python:3.9-slim

WORKDIR /app

# Install essential system packages that are needed across all platforms
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python packages with platform-agnostic configurations
# We use the CPU-only version of PyTorch which works everywhere
RUN pip install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Create model directory
RUN mkdir -p /models/ui-tars-7b-dpo

# Copy application files
COPY ui_tars_server.py .
COPY commands.json .

# Expose the port
EXPOSE 8000

# Add healthcheck to monitor the application
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start the application with reasonable defaults for memory management
CMD ["uvicorn", "ui_tars_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]