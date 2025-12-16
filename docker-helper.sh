#!/bin/bash
# Docker Compose Helper Script
# Quick commands for managing the Code Sharing Platform containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Commands
case "${1:-help}" in
    up)
        print_header "Starting Services"
        docker-compose up -d
        print_success "All services started"
        echo ""
        print_info "Frontend: http://localhost"
        print_info "Backend: http://localhost:8080/api"
        print_info "GraphQL: http://localhost:8080/api/graphiql"
        ;;
    
    down)
        print_header "Stopping Services"
        docker-compose down
        print_success "All services stopped"
        ;;
    
    logs)
        print_header "Showing Logs"
        docker-compose logs -f
        ;;
    
    logs-backend)
        print_header "Backend Logs"
        docker-compose logs -f backend
        ;;
    
    logs-frontend)
        print_header "Frontend Logs"
        docker-compose logs -f frontend
        ;;
    
    ps)
        print_header "Container Status"
        docker-compose ps
        ;;
    
    build)
        print_header "Building Images"
        docker-compose build
        print_success "Images built"
        ;;
    
    rebuild)
        print_header "Rebuilding and Starting"
        docker-compose down -v
        docker-compose up -d --build
        print_success "Services rebuilt and started"
        ;;
    
    clean)
        print_header "Cleaning Up"
        docker-compose down -v --rmi all
        print_success "All containers, volumes, and images removed"
        ;;
    
    psql)
        print_header "PostgreSQL CLI"
        docker-compose exec postgres psql -U postgres -d code_sharing_platform
        ;;
    
    mongo)
        print_header "MongoDB CLI"
        docker-compose exec mongodb mongosh
        ;;
    
    shell-backend)
        print_header "Backend Shell"
        docker-compose exec backend sh
        ;;
    
    shell-frontend)
        print_header "Frontend Shell"
        docker-compose exec frontend sh
        ;;
    
    health)
        print_header "Service Health Status"
        docker-compose ps --format "table {{.Service}}\t{{.Status}}"
        ;;
    
    restart)
        print_header "Restarting Services"
        docker-compose restart
        print_success "Services restarted"
        ;;
    
    restart-backend)
        print_header "Restarting Backend"
        docker-compose restart backend
        print_success "Backend restarted"
        ;;
    
    restart-frontend)
        print_header "Restarting Frontend"
        docker-compose restart frontend
        print_success "Frontend restarted"
        ;;
    
    stats)
        print_header "Container Resource Usage"
        docker-compose stats
        ;;
    
    *)
        echo -e "${BLUE}Code Sharing Platform - Docker Helper${NC}"
        echo ""
        echo "Usage: ./docker-helper.sh [command]"
        echo ""
        echo "Commands:"
        echo -e "  ${GREEN}up${NC}                 Start all services"
        echo -e "  ${GREEN}down${NC}               Stop all services"
        echo -e "  ${GREEN}logs${NC}               View logs (all services)"
        echo -e "  ${GREEN}logs-backend${NC}       View backend logs"
        echo -e "  ${GREEN}logs-frontend${NC}      View frontend logs"
        echo -e "  ${GREEN}ps${NC}                 Show container status"
        echo -e "  ${GREEN}build${NC}              Build all images"
        echo -e "  ${GREEN}rebuild${NC}            Rebuild and start fresh"
        echo -e "  ${GREEN}clean${NC}              Remove all containers, volumes, and images"
        echo -e "  ${GREEN}psql${NC}               Open PostgreSQL CLI"
        echo -e "  ${GREEN}mongo${NC}              Open MongoDB CLI"
        echo -e "  ${GREEN}shell-backend${NC}      Open backend shell"
        echo -e "  ${GREEN}shell-frontend${NC}     Open frontend shell"
        echo -e "  ${GREEN}health${NC}             Show service health status"
        echo -e "  ${GREEN}restart${NC}            Restart all services"
        echo -e "  ${GREEN}restart-backend${NC}    Restart backend only"
        echo -e "  ${GREEN}restart-frontend${NC}   Restart frontend only"
        echo -e "  ${GREEN}stats${NC}              Show resource usage"
        echo ""
        ;;
esac
