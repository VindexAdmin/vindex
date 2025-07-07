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
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"github.com/vindexchain/core/internal/api"
	"github.com/vindexchain/core/internal/blockchain"
	"github.com/vindexchain/core/internal/config"
	"github.com/vindexchain/core/internal/consensus"
	"github.com/vindexchain/core/internal/database"
	"github.com/vindexchain/core/internal/domains"
	"github.com/vindexchain/core/internal/monitoring"
	"github.com/vindexchain/core/internal/p2p"
	"github.com/vindexchain/core/internal/staking"
	"github.com/vindexchain/core/internal/tokens"
	"github.com/vindexchain/core/internal/websocket"
)

const (
	// VindexChain constants
	ChainID          = "vindexchain-1"
	NativeDenom      = "oc"
	AddressPrefix    = "vindex"
	InitialSupply    = 1000000000000000000 // 1 billion OC$ with 9 decimals
	MinValidators    = 4
	MaxValidators    = 100
	BlockTime        = 3 * time.Second
	UnbondingPeriod  = 21 * 24 * time.Hour // 21 days
	AutoBurnRate     = 0.01                // 1% monthly
	AutoBurnThreshold = 6 * 30 * 24 * time.Hour // 6 months
)

var (
	logger *zap.Logger
	cfg    *config.Config
)

func main() {
	// Initialize logger
	var err error
	logger, err = zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Create root command
	rootCmd := &cobra.Command{
		Use:   "vindexchain",
		Short: "VindexChain - The First Blockchain of Puerto Rico",
		Long: `VindexChain is a next-generation Proof of Stake blockchain
designed for high performance, low fees, and regulatory compliance.
Built specifically for the Puerto Rican market while maintaining global accessibility.`,
		Run: runNode,
	}

	// Add subcommands
	rootCmd.AddCommand(
		initCmd(),
		startCmd(),
		versionCmd(),
		keysCmd(),
		txCmd(),
		queryCmd(),
	)

	// Add flags
	rootCmd.PersistentFlags().String("home", "", "directory for config and data")
	rootCmd.PersistentFlags().String("log-level", "info", "log level (debug, info, warn, error)")
	rootCmd.PersistentFlags().String("config", "", "config file path")

	// Bind flags to viper
	viper.BindPFlag("home", rootCmd.PersistentFlags().Lookup("home"))
	viper.BindPFlag("log-level", rootCmd.PersistentFlags().Lookup("log-level"))
	viper.BindPFlag("config", rootCmd.PersistentFlags().Lookup("config"))

	// Execute command
	if err := rootCmd.Execute(); err != nil {
		logger.Fatal("Failed to execute command", zap.Error(err))
	}
}

func runNode(cmd *cobra.Command, args []string) {
	logger.Info("Starting VindexChain node", 
		zap.String("chain_id", ChainID),
		zap.String("version", "1.0.0"),
	)

	// Load configuration
	cfg = config.LoadConfig()
	
	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer db.Close()

	// Initialize monitoring
	monitoring := monitoring.NewMonitoring(&monitoring.Config{
		PrometheusAddr: ":8080",
		Logger:         logger,
	})
	go monitoring.Start()

	// Initialize blockchain core
	bc := blockchain.NewBlockchain(&blockchain.Config{
		ChainID:         ChainID,
		NativeDenom:     NativeDenom,
		AddressPrefix:   AddressPrefix,
		InitialSupply:   InitialSupply,
		BlockTime:       BlockTime,
		Database:        db,
		Logger:          logger,
		AutoBurnRate:    AutoBurnRate,
		AutoBurnThreshold: AutoBurnThreshold,
	})

	// Initialize consensus engine
	consensus := consensus.NewPoSConsensus(&consensus.Config{
		MinValidators:   MinValidators,
		MaxValidators:   MaxValidators,
		UnbondingPeriod: UnbondingPeriod,
		Blockchain:      bc,
		Logger:          logger,
	})

	// Initialize staking module
	stakingModule := staking.NewStakingModule(bc, consensus, logger)

	// Initialize token factory
	tokenFactory := tokens.NewTokenFactory(bc, &tokens.Config{
		CreationFee:     100000000000, // $100 in OC$ (9 decimals)
		LiquidityShare:  50,           // 50% to liquidity
		ValidatorShare:  20,           // 20% to validators
		DevTeamShare:    20,           // 20% to dev team
		LPShare:         10,           // 10% to LP
		Logger:          logger,
	})

	// Initialize domain system
	domainSystem := domains.NewDomainSystem(bc, &domains.Config{
		RegistrationFee: 1000000000, // 1 OC$ (9 decimals)
		RenewalFee:      1000000000, // 1 OC$ per year
		Logger:          logger,
	})

	// Initialize P2P network
	p2pNode := p2p.NewNode(&p2p.Config{
		ListenAddr: cfg.P2PListenAddr,
		ChainID:    ChainID,
		Blockchain: bc,
		Consensus:  consensus,
		Logger:     logger,
	})

	// Initialize WebSocket server
	wsServer := websocket.NewServer(bc, consensus, logger)

	// Start blockchain services
	go func() {
		if err := bc.Start(); err != nil {
			logger.Fatal("Failed to start blockchain", zap.Error(err))
		}
	}()

	go func() {
		if err := consensus.Start(); err != nil {
			logger.Fatal("Failed to start consensus", zap.Error(err))
		}
	}()

	go func() {
		if err := p2pNode.Start(); err != nil {
			logger.Fatal("Failed to start P2P node", zap.Error(err))
		}
	}()

	go func() {
		if err := wsServer.Start(cfg.WSListenAddr); err != nil {
			logger.Fatal("Failed to start WebSocket server", zap.Error(err))
		}
	}()

	// Setup HTTP API server
	router := gin.New()
	router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		Formatter: func(param gin.LogFormatterParams) string {
			return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
				param.ClientIP,
				param.TimeStamp.Format(time.RFC1123),
				param.Method,
				param.Path,
				param.Request.Proto,
				param.StatusCode,
				param.Latency,
				param.Request.UserAgent(),
				param.ErrorMessage,
			)
		},
	}))
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
		DomainSystem:   domainSystem,
		P2PNode:        p2pNode,
		Logger:         logger,
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
		
		// Compliance endpoints
		v1.GET("/compliance/ofac/:address", apiHandler.CheckOFAC)
		v1.POST("/compliance/kyc", apiHandler.SubmitKYC)
		v1.GET("/compliance/kyc/:address", apiHandler.GetKYCStatus)
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
			"chain_id":  ChainID,
			"uptime":    time.Since(time.Now()).String(),
		})
	})

	// Metrics endpoint for Prometheus
	router.GET("/metrics", monitoring.PrometheusHandler())

	// Start HTTP server
	server := &http.Server{
		Addr:    cfg.HTTPListenAddr,
		Handler: router,
	}

	go func() {
		logger.Info("Starting VindexChain HTTP API server", 
			zap.String("addr", cfg.HTTPListenAddr),
		)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start HTTP server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down VindexChain...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("HTTP server forced to shutdown", zap.Error(err))
	}

	// Stop blockchain services
	bc.Stop()
	consensus.Stop()
	p2pNode.Stop()
	wsServer.Stop()

	logger.Info("VindexChain stopped gracefully")
}

func initCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "init [moniker]",
		Short: "Initialize a new VindexChain node",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			moniker := args[0]
			logger.Info("Initializing VindexChain node", zap.String("moniker", moniker))
			
			// Initialize node configuration
			// Implementation here
			
			logger.Info("Node initialized successfully")
		},
	}
	
	cmd.Flags().String("chain-id", ChainID, "genesis file chain-id")
	cmd.Flags().String("home", "", "node's home directory")
	
	return cmd
}

func startCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the VindexChain node",
		Run:   runNode,
	}
	
	return cmd
}

func versionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the version information",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("VindexChain v1.0.0\n")
			fmt.Printf("Chain ID: %s\n", ChainID)
			fmt.Printf("Native Denom: %s\n", NativeDenom)
			fmt.Printf("Address Prefix: %s\n", AddressPrefix)
		},
	}
}

func keysCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "keys",
		Short: "Manage keys",
	}
	
	// Add key management subcommands
	cmd.AddCommand(
		&cobra.Command{
			Use:   "add [name]",
			Short: "Add a new key",
			Args:  cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) {
				// Implementation for adding keys
			},
		},
		&cobra.Command{
			Use:   "list",
			Short: "List all keys",
			Run: func(cmd *cobra.Command, args []string) {
				// Implementation for listing keys
			},
		},
	)
	
	return cmd
}

func txCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "tx",
		Short: "Transaction subcommands",
	}
	
	// Add transaction subcommands
	cmd.AddCommand(
		&cobra.Command{
			Use:   "send [from] [to] [amount]",
			Short: "Send tokens",
			Args:  cobra.ExactArgs(3),
			Run: func(cmd *cobra.Command, args []string) {
				// Implementation for sending tokens
			},
		},
	)
	
	return cmd
}

func queryCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "query",
		Short: "Query subcommands",
	}
	
	// Add query subcommands
	cmd.AddCommand(
		&cobra.Command{
			Use:   "account [address]",
			Short: "Query account information",
			Args:  cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) {
				// Implementation for querying accounts
			},
		},
	)
	
	return cmd
}