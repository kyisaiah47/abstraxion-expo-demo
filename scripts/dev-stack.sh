#!/bin/bash

# ProofPay Development Stack Orchestration
# Starts all services needed for demo and development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INDEXER_PORT=3001
VERIFIER_PORT=3002
EXPO_PORT=8081
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INDEXER_DIR="$PROJECT_ROOT/indexer"
VERIFIER_DIR="$PROJECT_ROOT/mock-verifier"
SEED_SCRIPT="$PROJECT_ROOT/scripts/seed-data.ts"

# PID files for cleanup
PID_DIR="$PROJECT_ROOT/.pids"
mkdir -p "$PID_DIR"

# Logging
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

echo_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Cleanup function
cleanup() {
    echo_step "Cleaning up background processes..."
    
    if [ -f "$PID_DIR/indexer.pid" ]; then
        kill "$(cat "$PID_DIR/indexer.pid")" 2>/dev/null || true
        rm -f "$PID_DIR/indexer.pid"
    fi
    
    if [ -f "$PID_DIR/verifier.pid" ]; then
        kill "$(cat "$PID_DIR/verifier.pid")" 2>/dev/null || true
        rm -f "$PID_DIR/verifier.pid"
    fi
    
    if [ -f "$PID_DIR/expo.pid" ]; then
        kill "$(cat "$PID_DIR/expo.pid")" 2>/dev/null || true
        rm -f "$PID_DIR/expo.pid"
    fi
    
    # Kill any processes still running on our ports
    lsof -ti :$INDEXER_PORT | xargs -r kill -9 2>/dev/null || true
    lsof -ti :$VERIFIER_PORT | xargs -r kill -9 2>/dev/null || true
    
    echo_success "Cleanup complete"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

check_dependencies() {
    echo_step "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo_error "npm is not installed"
        exit 1
    fi
    
    # Check tsx (for TypeScript execution)
    if ! command -v tsx &> /dev/null; then
        echo_warning "tsx not found globally, installing..."
        npm install -g tsx
    fi
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        echo_warning "Expo CLI not found, installing..."
        npm install -g @expo/cli
    fi
    
    echo_success "Dependencies check passed"
}

check_ports() {
    echo_step "Checking if ports are available..."
    
    if lsof -Pi :$INDEXER_PORT -sTCP:LISTEN -t >/dev/null ; then
        echo_error "Port $INDEXER_PORT is already in use (indexer)"
        exit 1
    fi
    
    if lsof -Pi :$VERIFIER_PORT -sTCP:LISTEN -t >/dev/null ; then
        echo_error "Port $VERIFIER_PORT is already in use (verifier)"
        exit 1
    fi
    
    echo_success "Ports are available"
}

check_env() {
    echo_step "Checking environment configuration..."
    
    # Check indexer .env
    if [ ! -f "$INDEXER_DIR/.env" ]; then
        echo_error "Missing indexer .env file. Copy from .env.example and configure."
        exit 1
    fi
    
    # Check main app .env
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo_warning "Missing main .env file. Some features may not work."
    fi
    
    # Check critical env vars in indexer
    while IFS= read -r line; do
        if [[ $line =~ ^[A-Z_][A-Z0-9_]*= ]]; then
            export "$line"
        fi
    done < "$INDEXER_DIR/.env"
    
    if [ -z "$SUPABASE_URL" ]; then
        echo_error "SUPABASE_URL not set in indexer/.env"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo_error "SUPABASE_SERVICE_ROLE_KEY not set in indexer/.env"
        exit 1
    fi
    
    echo_success "Environment configuration looks good"
}

install_dependencies() {
    echo_step "Installing dependencies..."
    
    # Install main project dependencies
    cd "$PROJECT_ROOT"
    if [ ! -d "node_modules" ] || [ "$1" = "--force" ]; then
        echo "Installing main project dependencies..."
        npm install
    fi
    
    # Install indexer dependencies
    cd "$INDEXER_DIR"
    if [ ! -d "node_modules" ] || [ "$1" = "--force" ]; then
        echo "Installing indexer dependencies..."
        npm install
    fi
    
    # Install verifier dependencies
    cd "$VERIFIER_DIR"
    if [ ! -d "node_modules" ] || [ "$1" = "--force" ]; then
        echo "Installing verifier dependencies..."
        npm install
    fi
    
    cd "$PROJECT_ROOT"
    echo_success "Dependencies installed"
}

build_services() {
    echo_step "Building services..."
    
    # Build indexer
    cd "$INDEXER_DIR"
    echo "Building indexer..."
    npm run build
    
    # Build verifier
    cd "$VERIFIER_DIR"
    echo "Building verifier..."
    npm run build
    
    cd "$PROJECT_ROOT"
    echo_success "Services built successfully"
}

start_indexer() {
    echo_step "Starting indexer service..."
    
    cd "$INDEXER_DIR"
    
    # Start indexer in background
    npm run dev > "$LOG_DIR/indexer.log" 2>&1 &
    INDEXER_PID=$!
    echo $INDEXER_PID > "$PID_DIR/indexer.pid"
    
    # Wait for indexer to start
    echo "Waiting for indexer to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$INDEXER_PORT/health" > /dev/null 2>&1; then
            echo_success "Indexer started on port $INDEXER_PORT (PID: $INDEXER_PID)"
            return 0
        fi
        sleep 1
    done
    
    echo_error "Indexer failed to start within 30 seconds"
    cat "$LOG_DIR/indexer.log" | tail -20
    exit 1
}

start_verifier() {
    echo_step "Starting mock verifier service..."
    
    cd "$VERIFIER_DIR"
    
    # Start verifier in background
    INDEXER_URL="http://localhost:$INDEXER_PORT" npm run dev > "$LOG_DIR/verifier.log" 2>&1 &
    VERIFIER_PID=$!
    echo $VERIFIER_PID > "$PID_DIR/verifier.pid"
    
    # Wait for verifier to start
    echo "Waiting for verifier to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$VERIFIER_PORT/health" > /dev/null 2>&1; then
            echo_success "Mock verifier started on port $VERIFIER_PORT (PID: $VERIFIER_PID)"
            return 0
        fi
        sleep 1
    done
    
    echo_error "Mock verifier failed to start within 30 seconds"
    cat "$LOG_DIR/verifier.log" | tail -20
    exit 1
}

seed_database() {
    echo_step "Seeding database with test data..."
    
    cd "$PROJECT_ROOT"
    
    # Export environment variables for seed script
    export SUPABASE_URL
    export SUPABASE_SERVICE_ROLE_KEY
    
    # Run seed script
    if tsx "$SEED_SCRIPT" "$@"; then
        echo_success "Database seeded successfully"
    else
        echo_error "Failed to seed database"
        exit 1
    fi
}

start_expo() {
    echo_step "Starting Expo development server..."
    
    cd "$PROJECT_ROOT"
    
    # Clear Expo cache if requested
    if [ "$1" = "--clear-cache" ]; then
        echo "Clearing Expo cache..."
        expo start -c &
    else
        expo start &
    fi
    
    EXPO_PID=$!
    echo $EXPO_PID > "$PID_DIR/expo.pid"
    
    echo_success "Expo started (PID: $EXPO_PID)"
    echo "Expo Metro will be available at http://localhost:$EXPO_PORT"
}

show_status() {
    echo ""
    echo "======================================"
    echo "🚀 ProofPay Development Stack Status"
    echo "======================================"
    echo ""
    
    # Check indexer
    if curl -s "http://localhost:$INDEXER_PORT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Indexer Service${NC}      http://localhost:$INDEXER_PORT"
    else
        echo -e "${RED}❌ Indexer Service${NC}      http://localhost:$INDEXER_PORT"
    fi
    
    # Check verifier
    if curl -s "http://localhost:$VERIFIER_PORT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Mock Verifier${NC}        http://localhost:$VERIFIER_PORT"
    else
        echo -e "${RED}❌ Mock Verifier${NC}        http://localhost:$VERIFIER_PORT"
    fi
    
    # Check Expo (harder to test, just check PID)
    if [ -f "$PID_DIR/expo.pid" ] && kill -0 "$(cat "$PID_DIR/expo.pid")" 2>/dev/null; then
        echo -e "${GREEN}✅ Expo Dev Server${NC}      http://localhost:$EXPO_PORT"
    else
        echo -e "${RED}❌ Expo Dev Server${NC}      http://localhost:$EXPO_PORT"
    fi
    
    echo ""
    echo "📋 Demo URLs:"
    echo "   • Indexer Health: http://localhost:$INDEXER_PORT/health"
    echo "   • Indexer Status: http://localhost:$INDEXER_PORT/status"
    echo "   • Verifier Health: http://localhost:$VERIFIER_PORT/health"
    echo "   • Expo Metro: http://localhost:$EXPO_PORT"
    echo ""
    echo "📱 Demo Users:"
    echo "   • Payer:  xion1payer123456789abcdef123456789abcdef1234"
    echo "   • Worker: xion1worker123456789abcdef123456789abcdef1234"
    echo ""
    echo "📄 Logs:"
    echo "   • Indexer: $LOG_DIR/indexer.log"
    echo "   • Verifier: $LOG_DIR/verifier.log"
    echo ""
    echo "⚡ Quick Commands:"
    echo "   • View logs:    tail -f $LOG_DIR/indexer.log"
    echo "   • Test API:     curl http://localhost:$INDEXER_PORT/health"
    echo "   • Stop stack:   ./scripts/dev-stack.sh stop"
    echo ""
    echo "Ready for demo! 🎉"
    echo "======================================"
}

# Command handling
case "${1:-start}" in
    "start"|"")
        echo "🚀 Starting ProofPay Development Stack"
        echo "======================================"
        
        check_dependencies
        check_ports
        check_env
        install_dependencies "${2}"
        build_services
        start_indexer
        start_verifier
        seed_database "${@:2}"
        start_expo "${@:2}"
        
        sleep 3  # Give services time to fully initialize
        show_status
        
        echo ""
        echo "Press Ctrl+C to stop all services"
        
        # Wait for Ctrl+C
        while true; do
            sleep 1
        done
        ;;
    
    "stop")
        echo "🛑 Stopping ProofPay Development Stack"
        cleanup
        ;;
    
    "restart")
        echo "🔄 Restarting ProofPay Development Stack"
        cleanup
        sleep 2
        exec "$0" start "${@:2}"
        ;;
    
    "status")
        show_status
        ;;
    
    "logs")
        case "${2:-all}" in
            "indexer")
                tail -f "$LOG_DIR/indexer.log"
                ;;
            "verifier")
                tail -f "$LOG_DIR/verifier.log"
                ;;
            "all"|"")
                tail -f "$LOG_DIR/indexer.log" "$LOG_DIR/verifier.log"
                ;;
            *)
                echo "Usage: $0 logs [indexer|verifier|all]"
                exit 1
                ;;
        esac
        ;;
    
    "seed")
        echo "🌱 Re-seeding database..."
        check_env
        seed_database "${@:2}"
        ;;
    
    "help")
        echo "ProofPay Development Stack"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  start     Start all services (default)"
        echo "  stop      Stop all services"
        echo "  restart   Restart all services"
        echo "  status    Show service status"
        echo "  logs      Show service logs [indexer|verifier|all]"
        echo "  seed      Re-seed database [--clear]"
        echo "  help      Show this help"
        echo ""
        echo "Start Options:"
        echo "  --force         Force reinstall dependencies"
        echo "  --clear-cache   Clear Expo cache"
        echo "  --clear         Clear existing data before seeding"
        echo ""
        echo "Examples:"
        echo "  $0 start                    # Start with defaults"
        echo "  $0 start --clear            # Start and clear existing data"
        echo "  $0 logs indexer             # View indexer logs"
        echo "  $0 seed --clear             # Re-seed database"
        ;;
    
    *)
        echo_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac