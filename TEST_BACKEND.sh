#!/bin/bash

API="http://localhost:5000"
ADMIN="http://localhost:4200"
SITE="http://localhost:3000"

echo "=== Testing ConferenceManager Backend ==="
echo

# 1. Health check
echo "1. Health check..."
curl -s "$API/api/health" || echo "FAIL: Backend not responding"
echo

# 2. Create user (registro)
echo "2. Registro usuario..."
REGISTER=$(curl -s -X POST "$API/api/auth/registro" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "password": "Test@1234"
  }')
echo "$REGISTER"
TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo

# 3. Create congreso
echo "3. Crear congreso..."
CONF=$(curl -s -X POST "$API/api/dashboard/conferencias" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "TestConf",
    "slug": "testconf",
    "fechaInicio": "2026-05-10",
    "fechaFin": "2026-05-12"
  }')
echo "$CONF"
CONF_ID=$(echo "$CONF" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Conf ID: $CONF_ID"
echo

# 4. Create sala
echo "4. Crear sala..."
SALA=$(curl -s -X POST "$API/api/dashboard/conferencias/$CONF_ID/salas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "Sala A",
    "capacidad": 100
  }')
echo "$SALA"
SALA_ID=$(echo "$SALA" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Sala ID: $SALA_ID"
echo

# 5. Create expositor
echo "5. Crear expositor..."
EXPO=$(curl -s -X POST "$API/api/dashboard/conferencias/$CONF_ID/expositores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "bio": "Expert speaker"
  }')
echo "$EXPO"
EXPO_ID=$(echo "$EXPO" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Expositor ID: $EXPO_ID"
echo

# 6. Create sesion (QR test)
echo "6. Crear sesion con QR..."
SESION=$(curl -s -X POST "$API/api/dashboard/conferencias/$CONF_ID/sesiones" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"salaId\": \"$SALA_ID\",
    \"expositorId\": \"$EXPO_ID\",
    \"titulo\": \"Intro to React\",
    \"fecha\": \"2026-05-10\",
    \"horaInicio\": \"10:00\",
    \"horaFin\": \"11:00\",
    \"track\": \"Frontend\"
  }")
echo "$SESION"
SESION_ID=$(echo "$SESION" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
QR=$(echo "$SESION" | grep -o '"qrCodeUrl":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Sesion ID: $SESION_ID"
echo "QR generated: $(echo "$QR" | head -c 50)..."
echo

# 7. Publish congreso
echo "7. Publicar congreso..."
PUBLISH=$(curl -s -X PUT "$API/api/dashboard/conferencias/$CONF_ID/publicar" \
  -H "Authorization: Bearer $TOKEN")
echo "$PUBLISH"
echo

# 8. Test public API
echo "8. Test public API..."
echo "Conferencia publica:"
curl -s "$API/api/public/testconf" | head -c 200
echo
echo
echo "Programa:"
curl -s "$API/api/public/testconf/programa" | head -c 200
echo
echo
echo "Sesion detalle:"
curl -s "$API/api/public/testconf/sesiones/$SESION_ID" | head -c 200
echo
echo

echo "=== Tests Completed ==="
