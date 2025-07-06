#!/bin/bash

# VindexChain Ecosystem Setup Script
# This script sets up the complete development environment

set -e

echo "🛡️  VindexChain Ecosystem Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check Go
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go 1.21+ first."
        exit 1
    fi
    
    GO_VERSION=$(go version | cut -d' ' -f3 | cut -d'o' -f2 | cut -d'.' -f2)
    if [ "$GO_VERSION" -lt 21 ]; then
        print_error "Go version 1.21+ is required. Current version: $(go version)"
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_status "Docker found - container deployment available"
    else
        print_warning "Docker not found - container deployment not available"
    fi
    
    print_status "Requirements check passed ✅"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install
    
    # Blockchain dependencies
    cd blockchain
    go mod download
    cd ..
    
    # Explorer dependencies
    cd explorer
    npm install
    cd ..
    
    # Wallet dependencies
    cd wallet
    npm install
    cd ..
    
    # DEX dependencies
    cd dex
    npm install
    cd ..
    
    # Website dependencies
    cd website
    npm install
    cd ..
    
    print_status "Dependencies installed ✅"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command -v docker &> /dev/null; then
        print_status "Starting PostgreSQL with Docker..."
        docker run -d --name vindexchain-db \
            -e POSTGRES_DB=vindexchain \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=your-super-secret-jwt-token-with-at-least-32-characters-long \
            -p 5432:5432 \
            postgres:15 || print_warning "Database container might already be running"
        
        # Wait for database to be ready
        sleep 5
        
        print_status "Database setup complete ✅"
    else
        print_warning "Docker not available. Please setup PostgreSQL manually:"
        echo "  - Install PostgreSQL 15+"
        echo "  - Create database 'vindexchain'"
        echo "  - Update DATABASE_URL in .env file"
    fi
}

# Build blockchain
build_blockchain() {
    print_status "Building blockchain core..."
    
    cd blockchain
    go build -o vindexchain main.go
    cd ..
    
    print_status "Blockchain core built ✅"
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    mkdir -p .git/hooks
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting before commit
npm run lint
if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix errors before committing."
    exit 1
fi
EOF
    
    chmod +x .git/hooks/pre-commit
    
    print_status "Git hooks setup ✅"
}

# Create initial configuration
create_config() {
    print_status "Creating initial configuration..."
    
    # Create blockchain config directory
    mkdir -p blockchain/config
    
    # Create genesis file template
    cat > blockchain/config/genesis.json << 'EOF'
{
  "genesis_time": "2024-01-01T00:00:00Z",
  "chain_id": "vindexchain-1",
  "initial_height": "1",
  "consensus_params": {
    "block": {
      "max_bytes": "22020096",
      "max_gas": "1000000000",
      "time_iota_ms": "1000"
    },
    "evidence": {
      "max_age_num_blocks": "100000",
      "max_age_duration": "172800000000000"
    },
    "validator": {
      "pub_key_types": ["ed25519"]
    }
  },
  "app_hash": "",
  "app_state": {
    "auth": {
      "params": {
        "max_memo_characters": "256",
        "tx_sig_limit": "7",
        "tx_size_cost_per_byte": "10",
        "sig_verify_cost_ed25519": "590",
        "sig_verify_cost_secp256k1": "1000"
      }
    },
    "bank": {
      "params": {
        "send_enabled": [],
        "default_send_enabled": true
      },
      "balances": [],
      "supply": [],
      "denom_metadata": []
    },
    "staking": {
      "params": {
        "unbonding_time": "1814400s",
        "max_validators": 100,
        "max_entries": 7,
        "historical_entries": 10000,
        "bond_denom": "oc"
      }
    }
  }
}
EOF
    
    print_status "Configuration created ✅"
}

# Main setup function
main() {
    echo "Starting VindexChain ecosystem setup..."
    echo
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    build_blockchain
    setup_git_hooks
    create_config
    
    echo
    print_status "🎉 Setup complete!"
    echo
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start development: npm run dev"
    echo "3. Visit http://localhost:3000 for the website"
    echo "4. Visit http://localhost:3001 for the explorer"
    echo "5. Visit http://localhost:3002 for the DEX"
    echo
    echo "For more information, see docs/README.md"
    echo
    print_status "Welcome to VindexChain! 🛡️"
}

# Run main function
main "$@"