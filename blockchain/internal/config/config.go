package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for VindexChain
type Config struct {
	// Network configuration
	ChainID         string
	NativeDenom     string
	AddressPrefix   string
	InitialSupply   uint64
	
	// Server configuration
	HTTPListenAddr    string
	P2PListenAddr     string
	WSListenAddr      string
	RPCListenAddress  string
	GRPCListenAddress string
	
	// Database configuration
	DatabaseURL string
	RedisURL    string
	
	// Node configuration
	NodeID       string
	Moniker      string
	GenesisFile  string
	
	// Consensus configuration
	BlockTime                 time.Duration
	CreateEmptyBlocks         bool
	CreateEmptyBlocksInterval time.Duration
	MinValidators             int
	MaxValidators             int
	UnbondingPeriod          time.Duration
	
	// Mempool configuration
	MempoolSize      int
	MempoolCacheSize int
	
	// P2P configuration
	MaxNumInboundPeers  int
	MaxNumOutboundPeers int
	PersistentPeers     string
	Seeds               string
	
	// API configuration
	APIEnable  bool
	APIAddress string
	
	// Security configuration
	JWTSecret     string
	EncryptionKey string
	
	// Compliance configuration
	KYCEnabled      bool
	OFACScreening   bool
	ChainalysisKey  string
	EllipticKey     string
	
	// Auto-burn configuration
	AutoBurnRate      float64
	AutoBurnThreshold time.Duration
	
	// Token Factory configuration
	TokenCreationFee uint64
	LiquidityShare   int
	ValidatorShare   int
	DevTeamShare     int
	LPShare          int
	
	// Domain configuration
	DomainRegistrationFee uint64
	DomainRenewalFee      uint64
	
	// Logging
	LogLevel  string
	LogFormat string
	Debug     bool
	
	// AI Module configuration
	AIModuleURL     string
	OpenAIAPIKey    string
	HuggingFaceKey  string
	
	// Monitoring configuration
	PrometheusAddr string
	GrafanaURL     string
	
	// Cloud configuration
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	GCPProjectID       string
	GCPServiceAccount  string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		// Network configuration
		ChainID:       getEnv("VINDEX_CHAIN_ID", "vindexchain-1"),
		NativeDenom:   getEnv("VINDEX_NATIVE_DENOM", "oc"),
		AddressPrefix: getEnv("VINDEX_ADDRESS_PREFIX", "vindex"),
		InitialSupply: getEnvUint64("VINDEX_INITIAL_SUPPLY", 1000000000000000000),
		
		// Server configuration
		HTTPListenAddr:    getEnv("VINDEX_API_HOST", "0.0.0.0") + ":" + getEnv("VINDEX_API_PORT", "1317"),
		P2PListenAddr:     ":" + getEnv("VINDEX_P2P_PORT", "26656"),
		WSListenAddr:      ":" + getEnv("VINDEX_RPC_PORT", "26657"),
		RPCListenAddress:  "tcp://0.0.0.0:" + getEnv("VINDEX_RPC_PORT", "26657"),
		GRPCListenAddress: "0.0.0.0:" + getEnv("VINDEX_GRPC_PORT", "9090"),
		
		// Database configuration
		DatabaseURL: getEnv("POSTGRES_URL", "postgresql://vindex:password@localhost:5432/vindexchain"),
		RedisURL:    getEnv("VINDEX_REDIS_URL", "redis://localhost:6379"),
		
		// Node configuration
		NodeID:      getEnv("VINDEX_NODE_ID", "vindexchain-node-1"),
		Moniker:     getEnv("VINDEX_MONIKER", "VindexChain Node"),
		GenesisFile: getEnv("VINDEX_GENESIS_FILE", "./config/genesis.json"),
		
		// Consensus configuration
		BlockTime:                 getEnvDuration("VINDEX_BLOCK_TIME", "3s"),
		CreateEmptyBlocks:         getEnvBool("VINDEX_CREATE_EMPTY_BLOCKS", true),
		CreateEmptyBlocksInterval: getEnvDuration("VINDEX_CREATE_EMPTY_BLOCKS_INTERVAL", "0s"),
		MinValidators:             getEnvInt("VINDEX_MIN_VALIDATORS", 4),
		MaxValidators:             getEnvInt("VINDEX_MAX_VALIDATORS", 100),
		UnbondingPeriod:          getEnvDuration("VINDEX_UNBONDING_PERIOD", "1814400s"), // 21 days
		
		// Mempool configuration
		MempoolSize:      getEnvInt("VINDEX_MEMPOOL_SIZE", 5000),
		MempoolCacheSize: getEnvInt("VINDEX_MEMPOOL_CACHE_SIZE", 10000),
		
		// P2P configuration
		MaxNumInboundPeers:  getEnvInt("VINDEX_MAX_INBOUND_PEERS", 40),
		MaxNumOutboundPeers: getEnvInt("VINDEX_MAX_OUTBOUND_PEERS", 10),
		PersistentPeers:     getEnv("VINDEX_PERSISTENT_PEERS", ""),
		Seeds:               getEnv("VINDEX_SEEDS", ""),
		
		// API configuration
		APIEnable:  getEnvBool("VINDEX_API_ENABLE", true),
		APIAddress: getEnv("VINDEX_API_ADDRESS", "tcp://0.0.0.0:1317"),
		
		// Security configuration
		JWTSecret:     getEnv("VINDEX_JWT_SECRET", "your-jwt-secret-key-here"),
		EncryptionKey: getEnv("VINDEX_ENCRYPTION_KEY", "your-encryption-key-here"),
		
		// Compliance configuration
		KYCEnabled:     getEnvBool("VINDEX_KYC_ENABLED", true),
		OFACScreening:  getEnvBool("VINDEX_OFAC_SCREENING", true),
		ChainalysisKey: getEnv("CHAINALYSIS_API_KEY", ""),
		EllipticKey:    getEnv("ELLIPTIC_API_KEY", ""),
		
		// Auto-burn configuration
		AutoBurnRate:      getEnvFloat64("VINDEX_AUTO_BURN_RATE", 0.01), // 1% monthly
		AutoBurnThreshold: getEnvDuration("VINDEX_AUTO_BURN_THRESHOLD", "4320h"), // 6 months
		
		// Token Factory configuration
		TokenCreationFee: getEnvUint64("VINDEX_TOKEN_CREATION_FEE", 100000000000), // $100 in OC$
		LiquidityShare:   getEnvInt("VINDEX_LIQUIDITY_SHARE", 50),
		ValidatorShare:   getEnvInt("VINDEX_VALIDATOR_SHARE", 20),
		DevTeamShare:     getEnvInt("VINDEX_DEV_TEAM_SHARE", 20),
		LPShare:          getEnvInt("VINDEX_LP_SHARE", 10),
		
		// Domain configuration
		DomainRegistrationFee: getEnvUint64("VINDEX_DOMAIN_REGISTRATION_FEE", 1000000000), // 1 OC$
		DomainRenewalFee:      getEnvUint64("VINDEX_DOMAIN_RENEWAL_FEE", 1000000000),      // 1 OC$
		
		// Logging
		LogLevel:  getEnv("VINDEX_LOG_LEVEL", "info"),
		LogFormat: getEnv("VINDEX_LOG_FORMAT", "json"),
		Debug:     getEnvBool("VINDEX_DEBUG", false),
		
		// AI Module configuration
		AIModuleURL:    getEnv("AI_MODULE_URL", "http://localhost:8000"),
		OpenAIAPIKey:   getEnv("OPENAI_API_KEY", ""),
		HuggingFaceKey: getEnv("HUGGINGFACE_API_KEY", ""),
		
		// Monitoring configuration
		PrometheusAddr: getEnv("PROMETHEUS_ADDR", ":8080"),
		GrafanaURL:     getEnv("GRAFANA_URL", "http://localhost:3000"),
		
		// Cloud configuration
		AWSRegion:          getEnv("AWS_REGION", "us-east-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		GCPProjectID:       getEnv("GCP_PROJECT_ID", ""),
		GCPServiceAccount:  getEnv("GCP_SERVICE_ACCOUNT_KEY", ""),
	}
}

// Helper functions for environment variable parsing
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvUint64(key string, defaultValue uint64) uint64 {
	if value := os.Getenv(key); value != "" {
		if uint64Value, err := strconv.ParseUint(value, 10, 64); err == nil {
			return uint64Value
		}
	}
	return defaultValue
}

func getEnvFloat64(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if float64Value, err := strconv.ParseFloat(value, 64); err == nil {
			return float64Value
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue string) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	if duration, err := time.ParseDuration(defaultValue); err == nil {
		return duration
	}
	return 0
}

// Validate validates the configuration
func (c *Config) Validate() error {
	// Add validation logic here
	if c.ChainID == "" {
		return fmt.Errorf("chain ID cannot be empty")
	}
	
	if c.NativeDenom == "" {
		return fmt.Errorf("native denomination cannot be empty")
	}
	
	if c.AddressPrefix == "" {
		return fmt.Errorf("address prefix cannot be empty")
	}
	
	if c.MinValidators < 1 {
		return fmt.Errorf("minimum validators must be at least 1")
	}
	
	if c.MaxValidators < c.MinValidators {
		return fmt.Errorf("maximum validators must be greater than minimum validators")
	}
	
	return nil
}