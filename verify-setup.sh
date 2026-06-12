#!/bin/bash

# 🔍 HushRyd Setup Verification Script
# This script checks if the development environment is properly configured

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if service is running
service_running() {
    if command_exists systemctl; then
        systemctl is-active --quiet "$1"
    elif command_exists brew; then
        brew services list | grep "$1" | grep started >/dev/null 2>&1
    else
        # Fallback: try to connect
        case "$1" in
            mysql)
                mysql -u root -e "SELECT 1;" >/dev/null 2>&1
                ;;
            redis)
                redis-cli ping >/dev/null 2>&1
                ;;
            *)
                return 1
                ;;
        esac
    fi
}

# Function to check port availability
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "$service is running on port $port"
        return 0
    else
        print_error "$service is not running on port $port"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    if command_exists curl; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
        if [ "$response" = "$expected_status" ]; then
            print_success "$description - HTTP $response"
            return 0
        else
            print_error "$description - HTTP $response (expected $expected_status)"
            return 1
        fi
    else
        print_warning "curl not available, skipping API test: $description"
        return 1
    fi
}

# Main verification function
main() {
    echo "🔍 HushRyd Development Environment Verification"
    echo "================================================"

    local errors=0
    local warnings=0

    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "mobile-app" ]; then
        print_error "Please run this script from the hushryd-new root directory"
        print_error "Expected directories: backend/, frontend/, mobile-app/"
        exit 1
    fi

    # System Prerequisites
    print_status "📋 Checking system prerequisites..."

    # Node.js
    if command_exists node; then
        local node_version=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$node_version" -ge 18 ]; then
            print_success "Node.js $(node --version) installed"
        else
            print_error "Node.js version 18+ required. Current: $(node --version)"
            ((errors++))
        fi
    else
        print_error "Node.js is not installed"
        ((errors++))
    fi

    # npm
    if command_exists npm; then
        local npm_version=$(npm --version | cut -d'.' -f1)
        if [ "$npm_version" -ge 8 ]; then
            print_success "npm $(npm --version) installed"
        else
            print_warning "npm version 8+ recommended. Current: $(npm --version)"
            ((warnings++))
        fi
    else
        print_error "npm is not installed"
        ((errors++))
    fi

    # MySQL
    if command_exists mysql; then
        print_success "MySQL client installed"
        if service_running mysql; then
            print_success "MySQL service is running"
        else
            print_error "MySQL service is not running"
            print_error "Start with: sudo systemctl start mysql (Linux) or brew services start mysql (macOS)"
            ((errors++))
        fi
    else
        print_error "MySQL client is not installed"
        ((errors++))
    fi

    # Redis
    if command_exists redis-cli; then
        print_success "Redis client installed"
        if service_running redis; then
            print_success "Redis service is running"
        else
            print_error "Redis service is not running"
            print_error "Start with: sudo systemctl start redis-server (Linux) or brew services start redis (macOS)"
            ((errors++))
        fi
    else
        print_error "Redis client is not installed"
        ((errors++))
    fi

    # Git
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3) installed"
    else
        print_warning "Git is not installed (optional but recommended)"
        ((warnings++))
    fi

    # Backend Verification
    print_status "📡 Checking backend setup..."

    cd backend

    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Backend dependencies not installed. Run: cd backend && npm install"
        ((errors++))
    fi

    # Check environment file
    if [ -f ".env" ]; then
        print_success "Backend .env file exists"

        # Check critical environment variables
        if grep -q "DATABASE_URL" .env; then
            print_success "DATABASE_URL configured"
        else
            print_error "DATABASE_URL not configured in .env"
            ((errors++))
        fi

        if grep -q "JWT_SECRET" .env; then
            print_success "JWT_SECRET configured"
        else
            print_error "JWT_SECRET not configured in .env"
            ((errors++))
        fi
    else
        print_error "Backend .env file missing. Copy from .env.example"
        ((errors++))
    fi

    # Check Prisma setup
    if [ -d "node_modules/.prisma" ]; then
        print_success "Prisma client generated"
    else
        print_error "Prisma client not generated. Run: npx prisma generate"
        ((errors++))
    fi

    # Check if backend server is running
    if check_port 3000 "Backend API"; then
        # Test API health endpoint
        if test_api "http://localhost:3000/health" 200 "Backend health check"; then
            print_success "Backend API is healthy"
        fi
    fi

    cd ..

    # Frontend Verification
    print_status "🌐 Checking frontend setup..."

    cd frontend

    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        print_success "Frontend dependencies installed"
    else
        print_error "Frontend dependencies not installed. Run: cd frontend && npm install"
        ((errors++))
    fi

    # Check if frontend server is running
    check_port 5173 "Frontend" || true  # Don't count as error if not running

    cd ..

    # Mobile App Verification
    print_status "📱 Checking mobile app setup..."

    cd mobile-app

    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        print_success "Mobile app dependencies installed"
    else
        print_warning "Mobile app dependencies not installed. Run: cd mobile-app && npm install"
        ((warnings++))
    fi

    cd ..

    # Database Connection Test
    print_status "🗄️ Testing database connection..."

    if command_exists mysql; then
        # Try to connect with the configured user
        if mysql -u hushryd -ppassword123 hushryd -e "SELECT 1 as test;" >/dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_error "Cannot connect to database with configured credentials"
            print_error "Check DATABASE_URL in backend/.env"
            ((errors++))
        fi
    fi

    # Redis Connection Test
    print_status "🔄 Testing Redis connection..."

    if command_exists redis-cli; then
        if redis-cli ping >/dev/null 2>&1; then
            print_success "Redis connection successful"
        else
            print_error "Cannot connect to Redis"
            ((errors++))
        fi
    fi

    # Summary
    echo ""
    echo "================================================"
    echo "🔍 VERIFICATION SUMMARY"
    echo "================================================"

    if [ $errors -eq 0 ]; then
        print_success "✅ All critical checks passed!"
        if [ $warnings -eq 0 ]; then
            print_success "🎉 Your development environment is ready!"
        else
            print_warning "⚠️  Setup is mostly ready, but $warnings warnings to address"
        fi
    else
        print_error "❌ $errors critical issues found that need to be fixed"
        echo ""
        echo "💡 Common fixes:"
        echo "1. Install missing prerequisites"
        echo "2. Start MySQL and Redis services"
        echo "3. Run: ./setup-dev.sh"
        echo "4. Check backend/.env configuration"
    fi

    echo ""
    echo "📚 For help, see:"
    echo "   README.md - Complete documentation"
    echo "   DEVELOPER_SETUP.md - Detailed setup guide"

    # Exit with error code if there were critical issues
    if [ $errors -gt 0 ]; then
        exit 1
    fi
}

# Check if script is run with --help or -h
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "HushRyd Setup Verification Script"
    echo ""
    echo "This script checks if your development environment is properly configured."
    echo ""
    echo "Usage:"
    echo "  ./verify-setup.sh       # Run verification"
    echo "  ./verify-setup.sh --help # Show this help message"
    echo ""
    echo "The script checks:"
    echo "  - System prerequisites (Node.js, npm, MySQL, Redis)"
    echo "  - Backend setup (dependencies, environment, database)"
    echo "  - Frontend setup (dependencies)"
    echo "  - Mobile app setup (dependencies)"
    echo "  - Service connectivity (database, Redis, API)"
    exit 0
fi

# Run main function
main "$@"
