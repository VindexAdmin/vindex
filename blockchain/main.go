package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/vindexchain/blockchain/internal/api"
	"github.com/vindexchain/blockchain/internal/blockchain"
	"github.com/vindexchain/blockchain/internal/config"
	"github.com/vindexchain/blockchain/internal/consensus"
	"github.com/vindexchain/blockchain/internal/database"
	"github.com/vindexchain/blockchain/internal/p2p"
	"github.com/vindexchain/blockchain/internal/staking"
	"github.com/vindexchain/blockchain/internal/tokens"
	"github.com/vindexchain/blockchain/internal/websocket"
)

const (
	// VindexChain constants
	ChainID          = "vindexchain-1"
	NativeDenom      = "oc"
	AddressPrefix    = "vindex"
	InitialSupply    = 1000000000000000 // 1 billion OC$ with 6 decimals
	MinValidators    = 4
	MaxValidators    = 100
	BlockTime        = 3 * time.Second
	UnbondingPeriod  = 21 * 24 * time.Hour // 21 days
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()
	
	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize blockchain core
	bc := blockchain.NewBlockchain(&blockchain.Config{
		ChainID:         ChainID,
		NativeDenom:     NativeDenom,
		AddressPrefix:   AddressPrefix,
		InitialSupply:   InitialSupply,
		BlockTime:       BlockTime,
		Database:        db,
	})

	// Initialize consensus engine
	consensus := consensus.NewPoSConsensus(&consensus.Config{
		MinValidators:   MinValidators,
		MaxValidators:   MaxValidators,
		UnbondingPeriod: UnbondingPeriod,
		Blockchain:      bc,
	})

	// Initialize staking module
	stakingModule := staking.NewStakingModule(bc, consensus)

	// Initialize token factory
	tokenFactory := tokens.NewTokenFactory(bc, &tokens.Config{
		CreationFee:     100000000, // $100 in OC$ (6 decimals)
		LiquidityShare:  50,        // 50% to liquidity
		ValidatorShare:  25,        // 25% to validators
		DevTeamShare:    25,        // 25% to dev team
	})

	// Initialize P2P network
	p2pNode := p2p.NewNode(&p2p.Config{
		ListenAddr: cfg.P2PListenAddr,
		ChainID:    ChainID,
		Blockchain: bc,
		Consensus:  consensus,
	})

	// Initialize WebSocket server
	wsServer := websocket.NewServer(bc, consensus)

	// Start blockchain services
	go func() {
		if err := bc.Start(); err != nil {
			log.Fatalf("Failed to start blockchain: %v", err)
		}
	}()

	go func() {
		if err := consensus.Start(); err != nil {
			log.Fatalf("Failed to start consensus: %v", err)
		}
	}()

	go func() {
		if err := p2pNode.Start(); err != nil {
			log.Fatalf("Failed to start P2P node: %v", err)
		}
	}()

	go func() {
		if err := wsServer.Start(cfg.WSListenAddr); err != nil {
			log.Fatalf("Failed to start WebSocket server: %v", err)
		}
	}()

	// Setup HTTP API server
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	router.Use(cors.New(corsConfig))

	// Initialize API handlers
	apiHandler := api.NewHandler(&api.Config{
		Blockchain:     bc,
		Consensus:      consensus,
		StakingModule:  stakingModule,
		TokenFactory:   tokenFactory,
		P2PNode:        p2pNode,
	})

	// Register API routes
	v1 := router.Group("/api/v1")
	{
		// Blockchain endpoints
		v1.GET("/status", apiHandler.GetStatus)
		v1.GET("/blocks", apiHandler.GetBlocks)
		v1.GET("/blocks/:height", apiHandler.GetBlock)
		v1.GET("/transactions", apiHandler.GetTransactions)
		v1.GET("/transactions/:hash", apiHandler.GetTransaction)
		
		// Account endpoints
		v1.GET("/accounts/:address", apiHandler.GetAccount)
		v1.GET("/accounts/:address/balance", apiHandler.GetBalance)
		v1.GET("/accounts/:address/transactions", apiHandler.GetAccountTransactions)
		
		// Transaction endpoints
		v1.POST("/transactions/broadcast", apiHandler.BroadcastTransaction)
		v1.POST("/transactions/simulate", apiHandler.SimulateTransaction)
		
		// Staking endpoints
		v1.GET("/staking/validators", apiHandler.GetValidators)
		v1.GET("/staking/validators/:address", apiHandler.GetValidator)
		v1.GET("/staking/delegations/:address", apiHandler.GetDelegations)
		v1.POST("/staking/delegate", apiHandler.Delegate)
		v1.POST("/staking/undelegate", apiHandler.Undelegate)
		
		// Token endpoints
		v1.GET("/tokens", apiHandler.GetTokens)
		v1.GET("/tokens/:denom", apiHandler.GetToken)
		v1.POST("/tokens/create", apiHandler.CreateToken)
		
		// Domain endpoints
		v1.GET("/domains", apiHandler.GetDomains)
		v1.GET("/domains/:name", apiHandler.GetDomain)
		v1.POST("/domains/register", apiHandler.RegisterDomain)
		
		// Statistics endpoints
		v1.GET("/stats/supply", apiHandler.GetSupplyStats)
		v1.GET("/stats/burn", apiHandler.GetBurnStats)
		v1.GET("/stats/network", apiHandler.GetNetworkStats)
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
			"chain_id":  ChainID,
		})
	})

	// Start HTTP server
	server := &http.Server{
		Addr:    cfg.HTTPListenAddr,
		Handler: router,
	}

	go func() {
		log.Printf("Starting VindexChain HTTP API server on %s", cfg.HTTPListenAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down VindexChain...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("HTTP server forced to shutdown: %v", err)
	}

	// Stop blockchain services
	bc.Stop()
	consensus.Stop()
	p2pNode.Stop()
	wsServer.Stop()

	log.Println("VindexChain stopped")
}