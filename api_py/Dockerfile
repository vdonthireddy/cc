FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy requirements
COPY api_py/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY api_py/ ./api_py/

# Expose port
EXPOSE 4000

# Run FastAPI with Uvicorn
CMD ["uvicorn", "api_py.main:app", "--host", "0.0.0.0", "--port", "4000", "--reload"]
