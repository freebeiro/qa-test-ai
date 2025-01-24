#!/bin/bash
source ui-tars-env/bin/activate

# Configure Metal acceleration
export PYTORCH_ENABLE_MPS_FALLBACK=1
export MPS_GRAPH_DUMMY_PARAMS=1

# Clean environment first
pip3 uninstall -y torch torchvision torchaudio vllm

# Install with version alignment
pip3 install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.0 \
  --index-url https://download.pytorch.org/whl/nightly/cpu

pip3 install "vllm>=0.4.2" --pre --extra-index-url https://download.pytorch.org/whl/nightly/cpu

# Verify installation
python3 -c "import torch; print(f'Torch: {torch.__version__}, MPS available: {torch.backends.mps.is_available()}')"


python -m vllm.entrypoints.openai.api_server \
  --served-model-name ui-tars \
  --model ./ui-tars-7b-dpo \
  --port 8001 \
  --device cpu \
  --max-parallel-loading-workers 2 \
  --dtype float32 \          # Use full precision for CPU stability
  --swap-space 16 \
  --max-model-len 2048 \
  --enforce-eager \
  --disable-log-requests \
  --scheduling-policy fcfs \
  --disable-custom-all-reduce \  # Disable GPU-specific optimizations
  --worker-use-ray \         # Enable distributed processing
  --max-seq-len-to-capture 0 \  # Disable CUDA graph capture
  --disable-sliding-window   # Disable memory optimization for attention