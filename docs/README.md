# VindexChain Documentation

Welcome to the comprehensive documentation for VindexChain - The first blockchain of Puerto Rico.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [API Reference](#api-reference)
5. [Development Guide](#development-guide)
6. [Deployment](#deployment)
7. [Security](#security)
8. [Contributing](#contributing)

## Introduction

VindexChain is a next-generation Proof of Stake blockchain designed for high performance, low fees, and regulatory compliance. Built specifically for the Puerto Rican market while maintaining global accessibility.

### Key Features

- **High Performance**: 65,000+ TPS with 3-second block times
- **Ultra Low Fees**: ~$0.001 per transaction
- **Native Token**: OC$ (OneChance) with deflationary mechanics
- **Token Factory**: Easy token creation with built-in liquidity
- **Web3 Domains**: .vindex domain system for user identities
- **Regulatory Compliant**: KYC/AML integration for Puerto Rico

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+
- PostgreSQL 15+
- Docker (optional)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/vindexchain/ecosystem
cd ecosystem

# Install dependencies
npm install

# Start development environment
npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   VindexWallet  │    │   VindexScan    │    │    BurnSwap     │
│   (Extension)   │    │  (Explorer)     │    │     (DEX)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │            VindexChain Core                     │
         │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
         │  │ Consensus   │  │   Staking   │  │ Tokens  │ │
         │  │   (PoS)     │  │   Module    │  │ Factory │ │
         │  └─────────────┘  └─────────────┘  └─────────┘ │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              Database Layer                     │
         │        (PostgreSQL + Redis Cache)              │
         └─────────────────────────────────────────────────┘
```

### Core Components

#### 1. VindexChain Core
- **Language**: Go
- **Consensus**: Proof of Stake (PoS)
- **Block Time**: 3 seconds
- **Finality**: Instant
- **TPS**: 65,000+

#### 2. VindexWallet
- **Type**: Browser Extension + Mobile App
- **Supported Browsers**: Chrome, Firefox
- **Security**: Hardware-level encryption, 2FA
- **Languages**: English, Spanish

#### 3. VindexScan (Block Explorer)
- **Framework**: Next.js 14
- **Database**: PostgreSQL with Supabase
- **Features**: Real-time updates, advanced search, analytics

#### 4. BurnSwap (DEX)
- **Type**: Automated Market Maker (AMM)
- **Fees**: 0.01% per swap
- **Features**: Auto-burn mechanism, liquidity pools, analytics

## API Reference

### Base URL
```
Production: https://api.vindexchain.com
Development: http://localhost:1317
```

### Authentication
Most endpoints are public. For write operations, use wallet signatures:

```javascript
const signature = await wallet.signMessage(message);
```

### Core Endpoints

#### Get Network Status
```http
GET /api/v1/status
```

Response:
```json
{
  "chain_id": "vindexchain-1",
  "latest_block_height": "12345",
  "latest_block_time": "2024-01-15T10:30:00Z",
  "catching_up": false,
  "validator_info": {
    "address": "vindex1...",
    "pub_key": "...",
    "voting_power": "1000000"
  }
}
```

#### Get Account Balance
```http
GET /api/v1/accounts/{address}/balance
```

Response:
```json
{
  "address": "vindex1abc123...",
  "balances": [
    {
      "denom": "oc",
      "amount": "1000000000"
    }
  ]
}
```

#### Broadcast Transaction
```http
POST /api/v1/transactions/broadcast
```

Request:
```json
{
  "tx": "base64_encoded_transaction",
  "mode": "sync"
}
```

### Staking Endpoints

#### Get Validators
```http
GET /api/v1/staking/validators
```

#### Delegate Tokens
```http
POST /api/v1/staking/delegate
```

### Token Factory Endpoints

#### Create Token
```http
POST /api/v1/tokens/create
```

Request:
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "total_supply": "1000000000000",
  "decimals": 6,
  "description": "My custom token",
  "image_url": "https://example.com/logo.png"
}
```

## Development Guide

### Setting up Development Environment

1. **Clone and Install**
```bash
git clone https://github.com/vindexchain/ecosystem
cd ecosystem
npm install
```

2. **Database Setup**
```bash
# Start PostgreSQL
docker run -d --name vindexchain-db \
  -e POSTGRES_DB=vindexchain \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:15

# Run migrations
cd blockchain && go run migrations/migrate.go
```

3. **Environment Variables**
```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

4. **Start Development Servers**
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:core      # Blockchain core
npm run dev:explorer  # Block explorer
npm run dev:wallet    # Wallet extension
npm run dev:dex       # DEX interface
npm run dev:website   # Main website
```

### Project Structure

```
vindexchain-ecosystem/
├── blockchain/           # Go blockchain core
│   ├── internal/
│   │   ├── api/         # REST API handlers
│   │   ├── blockchain/  # Core blockchain logic
│   │   ├── consensus/   # PoS consensus
│   │   ├── staking/     # Staking module
│   │   └── tokens/      # Token factory
│   └── main.go
├── explorer/            # Next.js block explorer
│   ├── src/
│   │   ├── app/         # App router pages
│   │   ├── components/  # React components
│   │   └── hooks/       # Custom hooks
│   └── package.json
├── wallet/              # Browser extension
│   ├── src/
│   │   ├── popup/       # Extension popup
│   │   ├── background/  # Service worker
│   │   └── content/     # Content scripts
│   └── manifest.json
├── dex/                 # DEX interface
├── website/             # Main website
└── docs/                # Documentation
```

### Testing

```bash
# Run all tests
npm test

# Test specific component
npm run test:core
npm run test:explorer
npm run test:wallet
npm run test:dex
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Deployment

### Production Deployment

1. **Build All Components**
```bash
npm run build
```

2. **Deploy with Docker**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Environment Configuration**
```bash
# Production environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:5432/vindexchain
export REDIS_URL=redis://host:6379
```

### Validator Node Setup

1. **Initialize Node**
```bash
./vindexchain init --chain-id vindexchain-1 --moniker "my-validator"
```

2. **Configure Genesis**
```bash
# Download genesis file
wget https://raw.githubusercontent.com/vindexchain/network/main/genesis.json
cp genesis.json ~/.vindexchain/config/
```

3. **Start Validator**
```bash
./vindexchain start --p2p.persistent_peers="peer1@ip:port,peer2@ip:port"
```

## Security

### Wallet Security
- Private keys encrypted with AES-256
- Mnemonic phrases stored securely
- 2FA authentication required
- Hardware wallet support (planned)

### Network Security
- Validator slashing for malicious behavior
- Economic security through staking
- Regular security audits
- Bug bounty program

### Smart Contract Security
- Formal verification for critical contracts
- Automated testing and fuzzing
- Third-party security audits

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Review Process

1. All PRs require review from core team
2. Automated tests must pass
3. Security review for sensitive changes
4. Documentation updates required

## Support

- **Documentation**: https://docs.vindexchain.com
- **Discord**: https://discord.gg/vindexchain
- **Twitter**: https://twitter.com/vindexchain
- **Email**: support@vindexchain.com

## License

Apache License 2.0 - see [LICENSE](../LICENSE) file for details.

---

Built with ❤️ in Puerto Rico 🇵🇷