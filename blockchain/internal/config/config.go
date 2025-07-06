package config

import (
	"os"
	"strconv"
)

type Config struct {
	// Network configuration
	HTTPListenAddr string
	P2PListenAddr  string
	WSListenAddr   string
	
	// Database configuration
	DatabaseURL string
	
	// Node configuration
	NodeID       string
	Moniker      string
	ChainID      string
	GenesisFile  string
	
	// Consensus configuration
	CreateEmptyBlocks         bool
	CreateEmptyBlocksInterval int
	
	// Mempool configuration
	MempoolSize     int
	MempoolCacheSize int
	
	// P2P configuration
	MaxNumInboundPeers  int
	MaxNumOutboundPeers int
	PersistentPeers     string
	Seeds               string
	
	// RPC configuration
	RPCListenAddress string
	GRPCListenAddress string
	
	// API configuration
	APIEnable bool
	APIAddress string
	
	// Logging
	LogLevel  string
	LogFormat string
}

func LoadConfig() *Config {
	return &Config{
		HTTPListenAddr: getEnv("HTTP_LISTEN_ADDR", ":1317"),
		P2PListenAddr:  getEnv("P2P_LISTEN_ADDR", ":26656"),
		WSListenAddr:   getEnv("WS_LISTEN_ADDR", ":26657"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/vindexchain?sslmode=disable"),
		
		NodeID:      getEnv("NODE_ID", "vindexchain-node-1"),
		Moniker:     getEnv("MONIKER", "VindexChain Node"),
		ChainID:     getEnv("CHAIN_ID", "vindexchain-1"),
		GenesisFile: getEnv("GENESIS_FILE", "./genesis.json"),
		
		CreateEmptyBlocks:         getEnvBool("CREATE_EMPTY_BLOCKS", true),
		CreateEmptyBlocksInterval: getEnvInt("CREATE_EMPTY_BLOCKS_INTERVAL", 0),
		
		MempoolSize:      getEnvInt("MEMPOOL_SIZE", 5000),
		MempoolCacheSize: getEnvInt("MEMPOOL_CACHE_SIZE", 10000),
		
		MaxNumInboundPeers:  getEnvInt("MAX_NUM_INBOUND_PEERS", 40),
		MaxNumOutboundPeers: getEnvInt("MAX_NUM_OUTBOUND_PEERS", 10),
		PersistentPeers:     getEnv("PERSISTENT_PEERS", ""),
		Seeds:               getEnv("SEEDS", ""),
		
		RPCListenAddress:  getEnv("RPC_LISTEN_ADDRESS", "tcp://0.0.0.0:26657"),
		GRPCListenAddress: getEnv("GRPC_LISTEN_ADDRESS", "0.0.0.0:9090"),
		
		APIEnable:  getEnvBool("API_ENABLE", true),
		APIAddress: getEnv("API_ADDRESS", "tcp://0.0.0.0:1317"),
		
		LogLevel:  getEnv("LOG_LEVEL", "info"),
		LogFormat: getEnv("LOG_FORMAT", "plain"),
	}
}

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

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}