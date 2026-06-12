#!/bin/bash

# Dynamic State Management - Quick Start Guide
# ================================================

echo "🚀 HushRyd Dynamic State Management - Setup Guide"
echo "================================================"
echo ""

cd backend

echo "1️⃣  Checking TypeScript compilation..."
npx tsc --noEmit 2>&1 | grep -c "error" > /dev/null && echo "❌ TypeScript errors found" || echo "✅ TypeScript OK"
echo ""

echo "2️⃣  Checking migration status..."
npx prisma migrate status
echo ""

echo "3️⃣  (Optional) Run seed script to initialize states..."
echo "    npx ts-node scripts/seed-service-states.ts"
echo ""

echo "4️⃣  Test the feature:"
echo ""
echo "    # Get active states (public endpoint)"
echo "    curl http://localhost:3000/api/public/service-states"
echo ""
echo "    # Get service availability (public endpoint)"  
echo "    curl http://localhost:3000/api/public/service-availability"
echo ""
echo "    # Validate a state (public endpoint)"
echo "    curl -X POST http://localhost:3000/api/public/validate-state \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"state\": \"Telangana\"}'"
echo ""
echo "    # List all states (admin endpoint - requires auth)"
echo "    curl http://localhost:3000/api/admin/service-states \\"
echo "      -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'"
echo ""
echo "5️⃣  View data in Prisma Studio:"
echo "    npx prisma studio"
echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 For full documentation, see: ../DYNAMIC_STATES_IMPLEMENTATION.md"
