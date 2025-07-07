#!/bin/bash

# VindexChain Ecosystem Setup Script
# Complete development environment setup

set -e

echo "🛡️  VindexChain Ecosystem Setup"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${BLUE}[SETUP]${NC} $1"; }

# Configuration
ECOSYSTEM_DIR="vindexchain-ecosystem"
GO_VERSION="1.21"
NODE_VERSION="18"
POSTGRES_VERSION="15"

# Check system requirements
check_requirements() {
    print_header "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is required but not installed"
        exit 1
    fi
    
    print_status "System requirements check passed ✅"
}

# Setup project structure
setup_project_structure() {
    print_header "Setting up project structure..."
    
    mkdir -p $ECOSYSTEM_DIR/{
        blockchain/{cmd,internal/{api,blockchain,consensus,staking,tokens,domains,ai},pkg,scripts,configs},
        wallet/{src/{popup,background,content,shared},public,scripts},
        explorer/{src/{app,components,hooks,lib,types},public},
        dex/{src/{app,components,hooks,lib,types},public},
        website/{src/{app,components,lib},public},
        ai-module/{src/{predictor,reputation,chatbot},models,data},
        docs/{architecture,api,user-guides,legal},
        scripts/{deployment,testing,monitoring},
        configs/{k8s,helm,docker},
        .github/workflows
    }
    
    print_status "Project structure created ✅"
}

# Generate core configuration files
generate_configs() {
    print_header "Generating configuration files..."
    
    # Root package.json
    cat > $ECOSYSTEM_DIR/package.json << 'EOF'
{
  "name": "vindexchain-ecosystem",
  "version": "1.0.0",
  "description": "VindexChain - The First Blockchain of Puerto Rico",
  "private": true,
  "workspaces": [
    "wallet",
    "explorer", 
    "dex",
    "website",
    "ai-module"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:core\" \"npm run dev:explorer\" \"npm run dev:wallet\" \"npm run dev:dex\" \"npm run dev:website\"",
    "dev:core": "cd blockchain && go run cmd/vindexchain/main.go",
    "dev:explorer": "cd explorer && npm run dev",
    "dev:wallet": "cd wallet && npm run dev", 
    "dev:dex": "cd dex && npm run dev",
    "dev:website": "cd website && npm run dev",
    "build": "npm run build:core && npm run build:frontend",
    "build:core": "cd blockchain && go build -o bin/vindexchain cmd/vindexchain/main.go",
    "build:frontend": "npm run build:explorer && npm run build:wallet && npm run build:dex && npm run build:website",
    "test": "npm run test:core && npm run test:frontend",
    "test:core": "cd blockchain && go test ./...",
    "test:frontend": "npm run test:explorer && npm run test:wallet && npm run test:dex",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "k8s:deploy": "./scripts/deployment/deploy-k8s.sh",
    "monitoring:setup": "./scripts/monitoring/setup-monitoring.sh"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF

    # Docker Compose for development
    cat > $ECOSYSTEM_DIR/docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: vindexchain
      POSTGRES_USER: vindex
      POSTGRES_PASSWORD: vindex_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./blockchain/scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - vindexchain-network

  # ClickHouse for Analytics
  clickhouse:
    image: clickhouse/clickhouse-server:23.8-alpine
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    networks:
      - vindexchain-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - vindexchain-network

  # VindexChain Core
  vindexchain-core:
    build:
      context: ./blockchain
      dockerfile: Dockerfile.dev
    ports:
      - "26656:26656"  # P2P
      - "26657:26657"  # RPC
      - "1317:1317"    # REST API
      - "9090:9090"    # gRPC
    environment:
      - VINDEX_DB_HOST=postgres
      - VINDEX_DB_PORT=5432
      - VINDEX_DB_NAME=vindexchain
      - VINDEX_DB_USER=vindex
      - VINDEX_DB_PASSWORD=vindex_dev_password
      - VINDEX_REDIS_URL=redis://redis:6379
      - VINDEX_LOG_LEVEL=debug
    depends_on:
      - postgres
      - redis
      - clickhouse
    networks:
      - vindexchain-network
    volumes:
      - ./blockchain:/app
      - node_data:/app/data

  # VindexScan Explorer
  vindexscan:
    build:
      context: ./explorer
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://vindexchain-core:1317
      - NEXT_PUBLIC_WS_URL=ws://vindexchain-core:26657/websocket
      - DATABASE_URL=postgresql://vindex:vindex_dev_password@postgres:5432/vindexchain
      - CLICKHOUSE_URL=http://clickhouse:8123
    depends_on:
      - vindexchain-core
    networks:
      - vindexchain-network
    volumes:
      - ./explorer:/app

  # BurnSwap DEX
  burnswap:
    build:
      context: ./dex
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://vindexchain-core:1317
      - NEXT_PUBLIC_EXPLORER_URL=http://vindexscan:3000
    depends_on:
      - vindexchain-core
    networks:
      - vindexchain-network
    volumes:
      - ./dex:/app

  # VindexChain Website
  vindexchain-website:
    build:
      context: ./website
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_EXPLORER_URL=http://localhost:3001
      - NEXT_PUBLIC_DEX_URL=http://localhost:3002
    networks:
      - vindexchain-network
    volumes:
      - ./website:/app

  # AI Module Suite
  ai-module:
    build:
      context: ./ai-module
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      - VINDEX_API_URL=http://vindexchain-core:1317
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - POSTGRES_URL=postgresql://vindex:vindex_dev_password@postgres:5432/vindexchain
    depends_on:
      - vindexchain-core
      - postgres
    networks:
      - vindexchain-network
    volumes:
      - ./ai-module:/app

networks:
  vindexchain-network:
    driver: bridge

volumes:
  postgres_data:
  clickhouse_data:
  redis_data:
  node_data:
EOF

    # Environment template
    cat > $ECOSYSTEM_DIR/.env.example << 'EOF'
# VindexChain Ecosystem Environment Variables

# Network Configuration
VINDEX_CHAIN_ID=vindexchain-1
VINDEX_NATIVE_DENOM=oc
VINDEX_ADDRESS_PREFIX=vindex
VINDEX_INITIAL_SUPPLY=1000000000000000000

# Database Configuration
VINDEX_DB_HOST=localhost
VINDEX_DB_PORT=5432
VINDEX_DB_NAME=vindexchain
VINDEX_DB_USER=vindex
VINDEX_DB_PASSWORD=your-secure-password
DATABASE_URL=postgresql://vindex:your-secure-password@localhost:5432/vindexchain

# Redis Configuration
VINDEX_REDIS_URL=redis://localhost:6379

# ClickHouse Configuration
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=vindexchain_analytics

# API Configuration
VINDEX_API_HOST=0.0.0.0
VINDEX_API_PORT=1317
VINDEX_RPC_PORT=26657
VINDEX_P2P_PORT=26656
VINDEX_GRPC_PORT=9090

# Consensus Configuration
VINDEX_BLOCK_TIME=3s
VINDEX_MAX_VALIDATORS=100
VINDEX_MIN_VALIDATORS=4
VINDEX_UNBONDING_PERIOD=1814400s

# Security Configuration
VINDEX_JWT_SECRET=your-jwt-secret-key-here
VINDEX_ENCRYPTION_KEY=your-encryption-key-here

# Compliance Configuration
VINDEX_KYC_ENABLED=true
VINDEX_OFAC_SCREENING=true
CHAINALYSIS_API_KEY=your-chainalysis-api-key
ELLIPTIC_API_KEY=your-elliptic-api-key

# AI Module Configuration
OPENAI_API_KEY=your-openai-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
AI_MODEL_PREDICTOR=mistral-7b
AI_MODEL_REPUTATION=bert-base

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:1317
NEXT_PUBLIC_WS_URL=ws://localhost:26657/websocket
NEXT_PUBLIC_CHAIN_ID=vindexchain-1
NEXT_PUBLIC_NATIVE_DENOM=oc
NEXT_PUBLIC_ADDRESS_PREFIX=vindex
NEXT_PUBLIC_EXPLORER_URL=http://localhost:3001
NEXT_PUBLIC_DEX_URL=http://localhost:3002

# Cloud Configuration (Production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
GCP_PROJECT_ID=your-gcp-project
GCP_SERVICE_ACCOUNT_KEY=your-gcp-service-account-key

# Monitoring Configuration
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000
GRAFANA_ADMIN_PASSWORD=your-grafana-password

# Development Configuration
NODE_ENV=development
VINDEX_LOG_LEVEL=debug
VINDEX_DEBUG=true

# Production Configuration (uncomment for production)
# NODE_ENV=production
# VINDEX_LOG_LEVEL=info
# VINDEX_DEBUG=false
# SSL_CERT_PATH=/path/to/cert.pem
# SSL_KEY_PATH=/path/to/key.pem
EOF

    print_status "Configuration files generated ✅"
}

# Setup blockchain core
setup_blockchain_core() {
    print_header "Setting up blockchain core..."
    
    cd $ECOSYSTEM_DIR/blockchain
    
    # Initialize Go module
    go mod init github.com/vindexchain/core
    
    # Add dependencies
    go get github.com/gin-gonic/gin@latest
    go get github.com/gin-contrib/cors@latest
    go get github.com/gorilla/websocket@latest
    go get github.com/lib/pq@latest
    go get github.com/redis/go-redis/v9@latest
    go get github.com/cosmos/cosmos-sdk@v0.50.1
    go get github.com/cometbft/cometbft@v0.38.0
    go get github.com/spf13/cobra@latest
    go get github.com/spf13/viper@latest
    go get go.uber.org/zap@latest
    go get github.com/prometheus/client_golang@latest
    
    cd ..
    print_status "Blockchain core setup complete ✅"
}

# Setup frontend workspaces
setup_frontend_workspaces() {
    print_header "Setting up frontend workspaces..."
    
    # Explorer
    cd $ECOSYSTEM_DIR/explorer
    npm init -y
    npm install next@latest react@latest react-dom@latest typescript@latest
    npm install @types/node @types/react @types/react-dom --save-dev
    npm install tailwindcss@latest autoprefixer@latest postcss@latest
    npm install framer-motion lucide-react @tanstack/react-query
    npm install @supabase/supabase-js axios date-fns recharts
    cd ..
    
    # Wallet
    cd $ECOSYSTEM_DIR/wallet
    npm init -y
    npm install react@latest react-dom@latest typescript@latest
    npm install webpack@latest webpack-cli@latest ts-loader@latest
    npm install @types/chrome @types/react @types/react-dom --save-dev
    npm install tailwindcss framer-motion lucide-react zustand
    npm install bip39 crypto-js secp256k1 axios
    cd ..
    
    # DEX
    cd $ECOSYSTEM_DIR/dex
    npm init -y
    npm install next@latest react@latest react-dom@latest typescript@latest
    npm install @types/node @types/react @types/react-dom --save-dev
    npm install tailwindcss framer-motion lucide-react recharts
    npm install bignumber.js react-hot-toast @headlessui/react
    cd ..
    
    # Website
    cd $ECOSYSTEM_DIR/website
    npm init -y
    npm install next@latest react@latest react-dom@latest typescript@latest
    npm install @types/node @types/react @types/react-dom --save-dev
    npm install tailwindcss framer-motion lucide-react
    npm install @headlessui/react react-intersection-observer
    cd ..
    
    print_status "Frontend workspaces setup complete ✅"
}

# Setup AI module
setup_ai_module() {
    print_header "Setting up AI module..."
    
    cd $ECOSYSTEM_DIR/ai-module
    
    # Create Python virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Create requirements.txt
    cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
openai==1.3.7
transformers==4.36.0
torch==2.1.1
numpy==1.24.3
pandas==2.1.4
scikit-learn==1.3.2
langchain==0.0.350
chromadb==0.4.18
python-multipart==0.0.6
python-jose==3.3.0
passlib==1.7.4
python-dotenv==1.0.0
prometheus-client==0.19.0
structlog==23.2.0
EOF
    
    pip install -r requirements.txt
    
    cd ..
    print_status "AI module setup complete ✅"
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting up monitoring stack..."
    
    mkdir -p $ECOSYSTEM_DIR/monitoring/{prometheus,grafana,alertmanager}
    
    # Prometheus configuration
    cat > $ECOSYSTEM_DIR/monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'vindexchain-core'
    static_configs:
      - targets: ['vindexchain-core:8080']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'vindexscan'
    static_configs:
      - targets: ['vindexscan:3001']
    metrics_path: /api/metrics

  - job_name: 'burnswap'
    static_configs:
      - targets: ['burnswap:3002']
    metrics_path: /api/metrics

  - job_name: 'ai-module'
    static_configs:
      - targets: ['ai-module:8000']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
EOF

    print_status "Monitoring setup complete ✅"
}

# Setup CI/CD
setup_cicd() {
    print_header "Setting up CI/CD pipelines..."
    
    mkdir -p $ECOSYSTEM_DIR/.github/workflows
    
    # Main CI/CD workflow
    cat > $ECOSYSTEM_DIR/.github/workflows/ci-cd.yml << 'EOF'
name: VindexChain CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test-blockchain:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Run tests
      run: |
        cd blockchain
        go test -v -race -coverprofile=coverage.out ./...
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./blockchain/coverage.out

  test-frontend:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        component: [explorer, wallet, dex, website]
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: '${{ matrix.component }}/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd ${{ matrix.component }}
        npm ci
    
    - name: Run tests
      run: |
        cd ${{ matrix.component }}
        npm test
    
    - name: Run linting
      run: |
        cd ${{ matrix.component }}
        npm run lint

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  build-and-push:
    needs: [test-blockchain, test-frontend, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    strategy:
      matrix:
        component: [blockchain, explorer, dex, website, ai-module]
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.component }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./${{ matrix.component }}
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add staging deployment logic here

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add production deployment logic here
EOF

    print_status "CI/CD setup complete ✅"
}

# Main execution
main() {
    print_header "Starting VindexChain Ecosystem Setup"
    
    check_requirements
    setup_project_structure
    generate_configs
    setup_blockchain_core
    setup_frontend_workspaces
    setup_ai_module
    setup_monitoring
    setup_cicd
    
    print_status "🎉 VindexChain Ecosystem setup complete!"
    echo
    echo "Next steps:"
    echo "1. cd $ECOSYSTEM_DIR"
    echo "2. cp .env.example .env"
    echo "3. Edit .env with your configuration"
    echo "4. docker-compose -f docker-compose.dev.yml up -d"
    echo "5. npm run dev"
    echo
    echo "Access points:"
    echo "- Website: http://localhost:3000"
    echo "- Explorer: http://localhost:3001" 
    echo "- DEX: http://localhost:3002"
    echo "- API: http://localhost:1317"
    echo "- Monitoring: http://localhost:9090"
    echo
    print_status "Welcome to VindexChain! 🛡️🇵🇷"
}

# Execute main function
main "$@"