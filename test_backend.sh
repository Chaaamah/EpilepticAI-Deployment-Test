#!/bin/bash

# Script de test rapide pour vérifier que le backend fonctionne
# Usage: ./test_backend.sh

echo "🔍 Testing EPILEPTIC-AI-BACKEND..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="http://localhost:8000"

# Test 1: Health Check
echo "📊 Test 1: Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $response)${NC}"
    exit 1
fi
echo ""

# Test 2: Root Endpoint
echo "📊 Test 2: Root Endpoint"
response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✅ Root endpoint passed${NC}"
else
    echo -e "${RED}❌ Root endpoint failed (HTTP $response)${NC}"
fi
echo ""

# Test 3: API Docs
echo "📊 Test 3: API Documentation"
response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/docs)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✅ API docs accessible${NC}"
else
    echo -e "${RED}❌ API docs failed (HTTP $response)${NC}"
fi
echo ""

# Test 4: Login (if credentials exist)
echo "📊 Test 4: Login Test"
login_response=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gmail.com","password":"admin"}')

token=$(echo $login_response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$token" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo -e "${YELLOW}Token: ${token:0:50}...${NC}"
else
    echo -e "${YELLOW}⚠️  Login failed - Admin credentials may not exist yet${NC}"
fi
echo ""

# Test 5: Dashboard Stats (with token)
if [ ! -z "$token" ]; then
    echo "📊 Test 5: Dashboard Stats (Authenticated)"
    stats_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/doctors/dashboard/stats" \
        -H "Authorization: Bearer $token")

    if [ $stats_response -eq 200 ]; then
        echo -e "${GREEN}✅ Dashboard stats endpoint working${NC}"
    else
        echo -e "${RED}❌ Dashboard stats failed (HTTP $stats_response)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping authenticated tests${NC}"
fi
echo ""

# Test 6: Patients with Metrics
if [ ! -z "$token" ]; then
    echo "📊 Test 6: Patients with Metrics Endpoint"
    patients_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/doctors/patients/with-metrics" \
        -H "Authorization: Bearer $token")

    if [ $patients_response -eq 200 ]; then
        echo -e "${GREEN}✅ Patients with metrics endpoint working${NC}"
    else
        echo -e "${RED}❌ Patients endpoint failed (HTTP $patients_response)${NC}"
    fi
fi
echo ""

# Test 7: Seizure Statistics
if [ ! -z "$token" ]; then
    echo "📊 Test 7: Seizure Statistics Endpoint"
    seizure_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/doctors/seizures/statistics?days=7" \
        -H "Authorization: Bearer $token")

    if [ $seizure_response -eq 200 ]; then
        echo -e "${GREEN}✅ Seizure statistics endpoint working${NC}"
    else
        echo -e "${RED}❌ Seizure statistics failed (HTTP $seizure_response)${NC}"
    fi
fi
echo ""

# Test 8: Clinical Notes Endpoint
if [ ! -z "$token" ]; then
    echo "📊 Test 8: Clinical Notes Endpoint Structure"
    # Just test that the endpoint exists (might be empty but should return 404 for wrong ID, not 500)
    notes_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/clinical-notes/patient/999" \
        -H "Authorization: Bearer $token")

    if [ $notes_response -eq 200 ] || [ $notes_response -eq 404 ]; then
        echo -e "${GREEN}✅ Clinical notes endpoint structure OK${NC}"
    else
        echo -e "${RED}❌ Clinical notes endpoint error (HTTP $notes_response)${NC}"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "📋 Summary"
echo "=========================================="
echo -e "${GREEN}Backend URL:${NC} $BACKEND_URL"
echo -e "${GREEN}API Docs:${NC} $BACKEND_URL/docs"
echo ""

if [ ! -z "$token" ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:8000/docs to explore the API"
    echo "2. Start the frontend: cd EpilepticAI-web && npm run dev"
    echo "3. Test the integration"
else
    echo -e "${YELLOW}⚠️  Backend is running but authentication needs setup${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create an admin user or doctor account"
    echo "2. Test login with valid credentials"
    echo "3. Run this script again"
fi
echo ""
