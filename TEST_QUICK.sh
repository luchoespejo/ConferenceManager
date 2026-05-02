#!/bin/bash

API="http://localhost:5000"

echo "=== Test Quick (sin UI) ==="
echo

# 1. Registro
echo "1. Registrando usuario..."
REGISTER=$(curl -s -X POST "$API/api/auth/registro" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "password": "Test@1234"
  }')
echo "$REGISTER" | jq .

# 2. Login
echo
echo "2. Login..."
LOGIN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }')
TOKEN=$(echo "$LOGIN" | jq -r '.token')
echo "Token: $TOKEN"
echo

# 3. Crear congreso
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
CONF_ID=$(echo "$CONF" | jq -r '.data.id')
echo "Congreso ID: $CONF_ID"
echo

# 4. Crear sala
echo "4. Crear sala..."
SALA=$(curl -s -X POST "$API/api/dashboard/conferencias/$CONF_ID/salas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "Sala A",
    "capacidad": 100
  }')
SALA_ID=$(echo "$SALA" | jq -r '.data.id')
echo "Sala ID: $SALA_ID"
echo

# 5. Crear expositor
echo "5. Crear expositor..."
EXPO=$(curl -s -X POST "$API/api/dashboard/conferencias/$CONF_ID/expositores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "bio": "Expert speaker"
  }')
EXPO_ID=$(echo "$EXPO" | jq -r '.data.id')
echo "Expositor ID: $EXPO_ID"
echo

# 6. Crear sesion
echo "6. Crear sesion..."
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
SESION_ID=$(echo "$SESION" | jq -r '.data.id')
echo "Sesion ID: $SESION_ID"
echo

# 7. Publicar
echo "7. Publicar congreso..."
PUBLISH=$(curl -s -X PUT "$API/api/dashboard/conferencias/$CONF_ID/publicar" \
  -H "Authorization: Bearer $TOKEN")
echo "$PUBLISH" | jq '.data.estado'
echo

# 8. Test public API
echo "8. Test public API..."
echo "Conferencia publica:"
curl -s "$API/api/public/testconf" | jq .
echo
echo "Programa:"
curl -s "$API/api/public/testconf/programa" | jq .
echo
echo "Sesion detalle:"
curl -s "$API/api/public/testconf/sesiones/$SESION_ID" | jq .
