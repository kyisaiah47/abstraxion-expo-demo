#!/bin/bash

# ProofPay CLI zkTLS Verifier
# Simple command-line interface for testing zkTLS verification

set -e

VERIFIER_URL="http://localhost:3002"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

usage() {
    echo "ProofPay CLI zkTLS Verifier"
    echo ""
    echo "Usage: $0 <endpoint> [task_id] [worker]"
    echo ""
    echo "Examples:"
    echo "  $0 https://api.github.com/repos/user/repo/commits"
    echo "  $0 https://twitter.com/user/status/123456 task_001 xion1abc..."
    echo "  $0 https://api.example.com/data"
    echo ""
    echo "Environment:"
    echo "  VERIFIER_URL: Mock verifier URL (default: http://localhost:3002)"
    echo ""
    exit 1
}

check_verifier() {
    if ! curl -s "$VERIFIER_URL/health" > /dev/null 2>&1; then
        echo_error "Mock verifier is not running at $VERIFIER_URL"
        echo_info "Start it with: npm run demo:setup"
        exit 1
    fi
}

verify_endpoint() {
    local endpoint="$1"
    local task_id="${2:-cli_task_$(date +%s)}"
    local worker="${3:-cli_user}"
    
    echo_info "Verifying endpoint: $endpoint"
    echo_info "Task ID: $task_id"
    echo_info "Worker: $worker"
    echo ""
    
    # Make verification request
    local response
    response=$(curl -s -X POST "$VERIFIER_URL/verify" \
        -H "Content-Type: application/json" \
        -d "{
            \"endpoint\": \"$endpoint\",
            \"task_id\": \"$task_id\",
            \"worker\": \"$worker\",
            \"proof_type\": \"zktls\"
        }")
    
    if [ $? -ne 0 ]; then
        echo_error "Failed to make verification request"
        exit 1
    fi
    
    # Parse response
    local verified
    verified=$(echo "$response" | grep -o '"verified":[^,]*' | cut -d':' -f2 | tr -d ' ')
    
    if [ "$verified" = "true" ]; then
        echo_success "Verification successful!"
        
        # Extract zk_proof_hash
        local zk_hash
        zk_hash=$(echo "$response" | grep -o '"zk_proof_hash":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        if [ -n "$zk_hash" ]; then
            echo_info "zkTLS Proof Hash: $zk_hash"
        fi
        
        # Extract confidence score
        local confidence
        confidence=$(echo "$response" | grep -o '"confidence_score":[^,}]*' | cut -d':' -f2 | tr -d ' ')
        if [ -n "$confidence" ]; then
            echo_info "Confidence Score: $(echo "$confidence" | bc -l 2>/dev/null || echo "$confidence")"
        fi
        
        # Extract verification method
        local method
        method=$(echo "$response" | grep -o '"verification_method":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        if [ -n "$method" ]; then
            echo_info "Method: $method"
        fi
        
    else
        echo_error "Verification failed"
        
        # Extract error message
        local error_msg
        error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        if [ -n "$error_msg" ]; then
            echo_error "Error: $error_msg"
        fi
        
        exit 1
    fi
    
    echo ""
    echo "Full response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# Main execution
if [ $# -lt 1 ]; then
    usage
fi

ENDPOINT="$1"
TASK_ID="$2"
WORKER="$3"

# Validate endpoint URL
if [[ ! "$ENDPOINT" =~ ^https?:// ]]; then
    echo_error "Invalid endpoint URL. Must start with http:// or https://"
    exit 1
fi

check_verifier
verify_endpoint "$ENDPOINT" "$TASK_ID" "$WORKER"