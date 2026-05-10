#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Cleaning build artifacts..."
rm -rf backend/obj backend/bin backend/ConferenceManager.Tests/obj backend/ConferenceManager.Tests/bin

echo "Restoring packages..."
dotnet restore ConferenceManager.sln

echo "Building..."
dotnet build ConferenceManager.sln

echo "Running tests..."
dotnet test ConferenceManager.Tests --verbosity normal

echo "✓ All tests passed!"
