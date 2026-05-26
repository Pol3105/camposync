#!/bin/bash
# CampoSync Big Data Exp2 Query Performance Orchestrator

# Find base directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$( dirname "$SCRIPT_DIR" )" )"

# Activate python virtualenv
if [ -d "$PROJECT_DIR/big-data/venv" ]; then
    echo "Activating virtualenv in $PROJECT_DIR/big-data/venv..."
    source "$PROJECT_DIR/big-data/venv/bin/activate"
else
    echo "WARNING: Virtualenv not found at $PROJECT_DIR/big-data/venv, using system Python."
fi

# Run the python orchestrator with unbuffered output (-u)
python3 -u "$SCRIPT_DIR/scripts/run_all.py"
