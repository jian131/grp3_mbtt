#!/bin/bash
# Superset Setup Script
# Run this after docker compose up to initialize Superset

echo "🔄 Initializing Superset..."

# Create admin user
docker exec -it grp3_mbtt-superset-1 superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname User \
  --email admin@jfinder.local \
  --password admin123

# Initialize database
docker exec -it grp3_mbtt-superset-1 superset db upgrade

# Setup roles
docker exec -it grp3_mbtt-superset-1 superset init

echo "✅ Superset initialized!"
echo ""
echo "📊 Access Superset at: http://localhost:8088"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🔗 Add PostgreSQL Database Connection:"
echo "   1. Settings > Database Connections > + Database"
echo "   2. Choose PostgreSQL"
echo "   3. Connection String: postgresql://jfinder:jfinder_password@postgres:5432/jfinder_db"
