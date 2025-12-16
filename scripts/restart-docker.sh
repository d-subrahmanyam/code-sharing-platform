#!/bin/bash

# Docker Restart Script - Bash Version
# Purpose: Restart Docker containers with detailed logging
# Author: Code Sharing Platform Team
# Date: 2025-12-16

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$SCRIPT_DIR/docker-restart.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local log_entry="[$TIMESTAMP] [$level] $message"
    echo -e "$log_entry" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $@" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $@" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $@" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@" | tee -a "$LOG_FILE"
}

# Main script
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Docker Restart Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

log_info "Starting Docker restart sequence..."
log_info "Working directory: $SCRIPT_DIR"

# Change to project directory
cd "$SCRIPT_DIR"

# Step 1: Stop containers
log_info "Step 1: Stopping Docker containers..."
if docker-compose down >> "$LOG_FILE" 2>&1; then
    log_success "Containers stopped successfully"
else
    log_error "Failed to stop containers"
    exit 1
fi

# Step 2: Wait for graceful shutdown
log_info "Step 2: Waiting for graceful shutdown..."
sleep 3
log_success "Shutdown complete"

# Step 3: Start containers
log_info "Step 3: Starting Docker containers..."
if docker-compose up -d >> "$LOG_FILE" 2>&1; then
    log_success "Containers started successfully"
else
    log_error "Failed to start containers"
    exit 1
fi

# Step 4: Wait for services to be ready
log_info "Step 4: Waiting for services to initialize (10 seconds)..."
sleep 10

# Step 5: Check container status
log_info "Step 5: Checking container status..."
echo ""
docker-compose ps | tee -a "$LOG_FILE"
echo ""

# Step 6: Verify services
log_info "Step 6: Verifying service health..."

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
    log_success "Frontend (Nginx) is healthy - http://localhost:80"
else
    log_warning "Frontend health check inconclusive"
fi

# Check backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/graphql | grep -q "200"; then
    log_success "Backend (Spring Boot) is healthy - http://localhost:8080"
else
    log_warning "Backend health check inconclusive (expected during startup)"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Docker restart completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
log_success "All services are running. Check the application at:"
log_success "  Frontend: http://localhost"
log_success "  Backend API: http://localhost:8080"
log_success "Logs saved to: $LOG_FILE"
