#!/bin/bash

# Install dependencies
npm install

# Clean dist directory
rm -rf dist

# Transpile TypeScript
npm run build

# Function directories
FUNCTIONS=("product" "order" "invoice" "payment" "fulfillment")

for func in "${FUNCTIONS[@]}"; do
    # Create function directory
    mkdir -p "dist/$func/src"
    mkdir -p "dist/$func/types"
    mkdir -p "dist/$func/utils"
    
    # Move the function code to src directory
    mv "dist/$func/app.js" "dist/$func/src/"

    # Copy the shared files
    cp "dist/types/errors.js" "dist/$func/types/"
    cp "dist/types/index.js" "dist/$func/types/"
    cp "dist/utils/response.js" "dist/$func/utils/"
    
    # Copy package.json
    cp package.json "dist/$func/"
    
    # Install dependencies
    cd "dist/$func"
    npm install --production
    cd ../..
done
