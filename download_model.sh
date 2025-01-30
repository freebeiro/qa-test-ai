#!/bin/bash

MODEL_DIR="ui-tars/ui-tars-7b-dpo"
MODEL_FILES=(
    "model-00001-of-00004.safetensors"
    "model-00002-of-00004.safetensors"
    "model-00003-of-00004.safetensors"
    "model-00004-of-00004.safetensors"
    "config.json"
    "tokenizer_config.json"
    "special_tokens_map.json"
    "tokenizer.json"
    "model.safetensors.index.json"
    "vocab.json"
)

# Base URL for the model files
HF_REPO="https://huggingface.co/bytedance-research/UI-TARS-7B-DPO/resolve/main"

install_aria2() {
    if ! command -v aria2c &> /dev/null; then
        echo "Installing aria2 for better download management..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install aria2
        else
            sudo apt-get update && sudo apt-get install -y aria2
        fi
    fi
}

download_with_resume() {
    local file=$1
    local url="$HF_REPO/$file"
    local output="$MODEL_DIR/$file"
    
    echo "Downloading $file..."
    aria2c --stderr=true \
           --summary-interval=5 \
           --console-log-level=notice \
           --continue=true \
           --max-tries=0 \
           --retry-wait=5 \
           --max-connection-per-server=16 \
           --split=16 \
           --min-split-size=1M \
           --file-allocation=none \
           -d "$MODEL_DIR" \
           -o "$file" \
           "$url"
    
    return $?
}

verify_file_hash() {
    local file=$1
    local expected_hash=$2
    echo "Verifying hash for $file..."
    computed_hash=$(sha256sum "$MODEL_DIR/$file" | awk '{print $1}')
    if [ "$computed_hash" = "$expected_hash" ]; then
        return 0
    else
        return 1
    fi
}

check_model_files() {
    mkdir -p "$MODEL_DIR"
    
    # Download each file if missing or incomplete
    for file in "${MODEL_FILES[@]}"; do
        if [ ! -f "$MODEL_DIR/$file" ] || [ ! -s "$MODEL_DIR/$file" ]; then
            echo "Downloading missing file: $file"
            download_with_resume "$file"
            if [ $? -ne 0 ]; then
                echo "Error downloading $file"
                return 1
            fi
        else
            echo "File exists: $file"
        fi
    done
    
    return 0
}

main() {
    echo "Setting up UI-TARS model..."
    
    # Install aria2 for better download management
    install_aria2
    
    # Create model directory if it doesn't exist
    mkdir -p "$MODEL_DIR"
    
    # Check and download model files
    if check_model_files; then
        echo "Model files downloaded successfully!"
        echo "Model location: $MODEL_DIR"
    else
        echo "Error downloading model files. Please check your internet connection and try again."
        exit 1
    fi
}

main "$@"