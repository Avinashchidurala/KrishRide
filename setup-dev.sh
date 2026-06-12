#!/bin/bash

# 🚀 HushRyd Development Environment Setup Script
# This script automates the initial setup process for new developers

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

# Function to generate random string for JWT
generate_secret() {
    openssl rand -hex 32
}

# Main setup function
main() {
    print_status "🚀 Starting HushRyd Development Environment Setup..."

    # Check prerequisites
    print_status "📋 Checking prerequisites..."

    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_error "Visit: https://nodejs.org/"
        exit 1
    fi

    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm 8+ first."
        exit 1
    fi

    if ! command_exists mysql; then
        print_error "MySQL is not installed. Please install MySQL 8.0+ first."
        print_error "Ubuntu/Debian: sudo apt install mysql-server"
        print_error "macOS: brew install mysql"
        exit 1
    fi

    if ! command_exists redis-cli; then
        print_error "Redis is not installed. Please install Redis 6.0+ first."
        print_error "Ubuntu/Debian: sudo apt install redis-server"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current: $(node --version)"
        exit 1
    fi

    print_success "Prerequisites check passed!"

    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "mobile-app" ]; then
        print_error "Please run this script from the hushryd-new root directory"
        print_error "Expected directories: backend/, frontend/, mobile-app/"
        exit 1
    fi

    # Database setup
    print_status "🗄️ Setting up database..."

    # Test MySQL connection and create database
    print_status "Testing MySQL connection..."
    if ! mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
        print_warning "Cannot connect to MySQL as root user."
        print_warning "Please ensure MySQL is running and you have the correct credentials."
        print_warning "You may need to run: sudo mysql_secure_installation"
        read -p "Do you want to continue with manual database setup? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping database setup. Please set up manually."
        else
            print_status "Please run these MySQL commands manually:"
            echo "CREATE DATABASE hushryd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            echo "CREATE USER 'hushryd'@'localhost' IDENTIFIED BY 'password123';"
            echo "GRANT ALL PRIVILEGES ON hushryd.* TO 'hushryd'@'localhost';"
            echo "FLUSH PRIVILEGES;"
        fi
    else
        print_success "MySQL connection successful"

        # Create database and user
        mysql -u root -e "CREATE DATABASE IF NOT EXISTS hushryd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
        mysql -u root -e "CREATE USER IF NOT EXISTS 'hushryd'@'localhost' IDENTIFIED BY 'password123';" 2>/dev/null || true
        mysql -u root -e "GRANT ALL PRIVILEGES ON hushryd.* TO 'hushryd'@'localhost';" 2>/dev/null || true
        mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null || true

        print_success "Database and user created successfully"
    fi

    # Backend setup
    print_status "📡 Setting up backend..."

    cd backend

    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install

    # Setup environment file
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cp .env.example .env

        # Generate secure JWT secrets
        JWT_SECRET=$(generate_secret)
        JWT_REFRESH_SECRET=$(generate_secret)

        # Update .env file with generated secrets and database URL
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://hushryd:password123@localhost:3306/hushryd\"|" .env
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env

        rm .env.bak 2>/dev/null || true

        print_success "Environment file created with secure secrets"
    else
        print_warning ".env file already exists, skipping creation"
    fi

    # Database migration
    print_status "Running database migrations..."
    npx prisma generate
    npx prisma migrate dev --name init

    cd ..

    # Frontend setup
    print_status "🌐 Setting up frontend..."

    cd frontend

    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install

    # Create basic .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > .env.local
        print_success "Frontend environment file created"
    fi

    cd ..

    # Mobile app setup (optional)
    print_status "📱 Setting up mobile app..."

    cd mobile-app

    # Install dependencies
    print_status "Installing mobile app dependencies..."
    npm install

    cd ..

    # Create startup script
    print_status "📝 Creating development startup script..."

    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting HushRyd Development Environment..."

# Start Backend
echo "📡 Starting Backend Server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start Frontend
echo "🌐 Starting Frontend Server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
sleep 5

echo "✅ Servers starting up..."
echo "📡 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

    chmod +x start-dev.sh

    print_success "Development startup script created"

    # Final instructions
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start the development environment:"
    echo "   ./start-dev.sh"
    echo ""
    echo "2. Or start manually:"
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd frontend && npm run dev"
    echo ""
    echo "3. Open your browser:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:3000"
    echo ""
    echo "4. Test the setup:"
    echo "   curl http://localhost:3000/health"
    echo ""
    echo "📚 For detailed documentation, see:"
    echo "   README.md - Complete documentation"
    echo "   DEVELOPER_SETUP.md - Detailed setup guide"
    echo ""
    print_warning "Important: Change default passwords in production!"
    echo "Database password: password123 (in .env)"
    echo "Admin credentials: Check backend/.env for defaults"
}

# Check if script is run with --help or -h
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "HushRyd Development Environment Setup Script"
    echo ""
    echo "This script automates the initial setup process for new developers."
    echo ""
    echo "Prerequisites:"
    echo "  - Node.js 18+"
    echo "  - npm 8+"
    echo "  - MySQL 8.0+"
    echo "  - Redis 6.0+"
    echo ""
    echo "Usage:"
    echo "  ./setup-dev.sh        # Run the complete setup"
    echo "  ./setup-dev.sh --help # Show this help message"
    echo ""
    echo "The script will:"
    echo "  - Check prerequisites"
    echo "  - Setup MySQL database and user"
    echo "  - Install dependencies for all modules"
    echo "  - Configure environment files"
    echo "  - Run database migrations"
    echo "  - Create a startup script"
    exit 0
fi

# Run main function
main "$@"
