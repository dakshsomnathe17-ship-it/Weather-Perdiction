#!/bin/bash
set -e

# Target directory
TEXTURES_DIR="frontend/public/textures"

echo "🌍 Downloading NASA Blue Marble textures..."

# Create directory if it doesn't exist
mkdir -p "$TEXTURES_DIR"

# Download Earth day map
echo "Downloading Earth day map..."
curl -L "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74017/world.200408.3x5400x2700.jpg" -o "$TEXTURES_DIR/earth_day.jpg"

# Download Earth night lights
echo "Downloading Earth night lights..."
curl -L "https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg" -o "$TEXTURES_DIR/earth_night.jpg"

# Download Cloud map
echo "Downloading Cloud map..."
curl -L "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg" -o "$TEXTURES_DIR/earth_clouds.jpg"

echo "✅ All textures downloaded successfully to $TEXTURES_DIR!"
echo "Note: These images are public domain from NASA Visible Earth."
