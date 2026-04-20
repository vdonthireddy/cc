#!/bin/bash

# Parse flags
IS_DEMO=false
DB_NAME="pathfinder"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --demo) IS_DEMO=true; DB_NAME="pathfinder_demo" ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running."
  exit 1
fi

# Create .env from .env.example if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Generated .env from .env.example"
  
  # Generate JWT_SECRET and ENCRYPTION_KEY
  JWT_SECRET=$(openssl rand -base64 32)
  ENCRYPTION_KEY=$(openssl rand -base64 32)
  
  # Replace values in .env (macOS/Linux compatible)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|JWT_SECRET=|JWT_SECRET=$JWT_SECRET|g" .env
    sed -i '' "s|ENCRYPTION_KEY=|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" .env
  else
    sed -i "s|JWT_SECRET=|JWT_SECRET=$JWT_SECRET|g" .env
    sed -i "s|ENCRYPTION_KEY=|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" .env
  fi
  echo "Secrets generated and added to .env"
fi

# Update DATABASE_URL in .env based on demo flag
# Assumes DATABASE_URL="mysql://root:pathfinder@db:3306/pathfinder" in .env.example
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|pathfinder@db:3306/.*|pathfinder@db:3306/$DB_NAME|g" .env
else
  sed -i "s|pathfinder@db:3306/.*|pathfinder@db:3306/$DB_NAME|g" .env
fi
echo "Using database: $DB_NAME"

# Build and start services
docker compose build
docker compose up -d

# Wait for DB to be healthy
echo "Waiting for database to be healthy..."
while [ "$(docker inspect -f '{{.State.Health.Status}}' pathfinder-db 2>/dev/null)" != "healthy" ]; do
  sleep 2
done

# Create demo database if needed and seed
if [ "$IS_DEMO" = true ]; then
  echo "--- Setting up Demo Environment ---"
  # Create the database inside MySQL
  docker exec pathfinder-db mysql -u root -ppathfinder -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
  
  # Run raw SQL schema to the demo DB
  echo "Applying SQL schema to $DB_NAME..."
  docker exec -i pathfinder-db mysql -u root -ppathfinder $DB_NAME < schema.sql
  
  # Seed the data
  echo "Seeding data from demo/seed.sql..."
  docker exec -i pathfinder-db mysql -u root -ppathfinder $DB_NAME < demo/seed.sql
  echo "Demo setup complete."
fi

echo "--- Services Started ---"
echo "Mode:   $(if [ "$IS_DEMO" = true ]; then echo "DEMO"; else echo "PROD"; fi)"
echo "Web:    http://localhost:3000"
echo "API:    http://localhost:4000"
echo "Adminer: http://localhost:8080 (DB UI)"
echo "------------------------"

# Tail logs
docker compose logs -f
