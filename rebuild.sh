#!/bin/bash

echo "--- Rebuilding Pathfinder Environment ---"

# Step 1: Cleanup
echo "Step 1: Cleaning up existing containers and volumes..."
docker compose down -v
docker system prune -f

# Step 2: Start fresh
# This now passes all arguments (like --demo) to the start script
echo "Step 2: Starting services..."
./start.sh "$@"
