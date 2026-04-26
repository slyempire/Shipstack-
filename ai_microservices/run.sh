#!/bin/bash

# Cortex AI Microservices Runner
# This script helps run the AI microservices locally or in Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Check if Python is available
check_python() {
    if command -v python3 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Run with Docker
run_docker() {
    print_info "Running Cortex AI with Docker Compose..."

    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi

    docker-compose up --build
}

# Run locally with Python
run_local() {
    print_info "Running Cortex AI locally with Python..."

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_info "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Install/update dependencies
    print_info "Installing dependencies..."
    pip install -r requirements.txt

    # Run the application
    print_info "Starting Cortex AI services..."
    print_info "API will be available at: http://localhost:8000"
    print_info "Health check: http://localhost:8000/health"
    print_warning "Press Ctrl+C to stop the services"

    python main.py
}

# Show usage
show_usage() {
    echo "Cortex AI Microservices Runner"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  docker    Run with Docker Compose (recommended for production)"
    echo "  local     Run locally with Python (for development)"
    echo "  help      Show this help message"
    echo ""
    echo "If no option is provided, the script will auto-detect the best method."
}

# Main logic
case "${1:-auto}" in
    "docker")
        if check_docker; then
            run_docker
        else
            print_error "Docker or Docker Compose not found!"
            print_info "Please install Docker and Docker Compose, or use 'local' option."
            exit 1
        fi
        ;;
    "local")
        if check_python; then
            run_local
        else
            print_error "Python 3 not found!"
            print_info "Please install Python 3.11 or higher."
            exit 1
        fi
        ;;
    "help"|"-h"|"--help")
        show_usage
        exit 0
        ;;
    "auto")
        print_info "Auto-detecting best run method..."
        if check_docker; then
            print_info "Docker detected, using Docker Compose..."
            run_docker
        elif check_python; then
            print_info "Python detected, running locally..."
            run_local
        else
            print_error "Neither Docker nor Python 3 found!"
            print_info "Please install Docker/Docker Compose or Python 3.11+"
            exit 1
        fi
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac