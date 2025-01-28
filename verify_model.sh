#!/bin/bash

MODEL_DIR="ui-tars/ui-tars-7b-dpo"
EXPECTED_FILES=(
    "model-00001-of-00004.safetensors"
    "model-00002-of-00004.safetensors"
    "model-00003-of-00004.safetensors"
    "model-00004-of-00004.safetensors"
    "model.safetensors.index.json"
    "config.json"
    "tokenizer.json"
    "vocab.json"
)

# Function to check file size (should be significant for model files)
check_file_size() {
    local file="$1"
    local size=$(stat -f%z "$MODEL_DIR/$file" 2>/dev/null || echo 0)
    
    if [[ $file == model-* ]] && [ "$size" -lt 1000000 ]; then
        echo "Warning: $file seems too small ($size bytes)"
        return 1
    fi
    return 0
}

echo "Verifying UI-TARS model files..."
echo "Model directory: $MODEL_DIR"

missing_files=()
incomplete_files=()

for file in "${EXPECTED_FILES[@]}"; do
    if [ ! -f "$MODEL_DIR/$file" ]; then
        echo "❌ Missing: $file"
        missing_files+=("$file")
    else
        if check_file_size "$file"; then
            echo "✅ Present: $file ($(stat -f%z "$MODEL_DIR/$file" 2>/dev/null || echo "unknown") bytes)"
        else
            echo "⚠️  Incomplete: $file"
            incomplete_files+=("$file")
        fi
    fi
done

if [ ${#missing_files[@]} -eq 0 ] && [ ${#incomplete_files[@]} -eq 0 ]; then
    echo "✅ All model files present and appear to be complete"
    exit 0
else
    echo "⚠️  Some files are missing or incomplete"
    if [ ${#missing_files[@]} -gt 0 ]; then
        echo "Missing files:"
        printf '%s\n' "${missing_files[@]}"
    fi
    if [ ${#incomplete_files[@]} -gt 0 ]; then
        echo "Incomplete files:"
        printf '%s\n' "${incomplete_files[@]}"
    fi
    exit 1
fi