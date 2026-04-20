#!/bin/bash

# Tear down services
docker compose down -v

# Cleanup
docker system prune -f

echo "Cleanup complete. All volumes and containers removed."
