#!/bin/bash
# ----------------------------------------------------
# SVPCET AI Attendance - Upload to GitHub Helper Script
# ----------------------------------------------------

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Before we can upload to GitHub, you need a Personal Access Token."
echo "GitHub does not allow normal passwords anymore."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👉 How to get your token:"
echo "1. Open your browser and go to: https://github.com/settings/tokens/new"
echo "2. Fill out the form (e.g. Note: Macbook Push)"
echo "3. Scroll down and check the very first box that says 'repo' (Full control of private repositories)"
echo "4. Scroll all the way to the bottom and click 'Generate Token'"
echo "5. Copy that long string of text!"
echo ""

# Ask user for token
read -s -p "Paste your Token here (it will NOT show up when you type, this is normal): " TOKEN
echo ""
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Error: You didn't enter a token. Trying again..."
    exit 1
fi

echo "🔄 Uploading files to GitHub..."

# Set the URL with the token
git remote set-url origin "https://Janardhan7330:${TOKEN}@github.com/Janardhan7330/collage_ai.git"

# Push the code
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Your code is now fully uploaded to GitHub!"
    echo "Link: https://github.com/Janardhan7330/collage_ai"
else
    echo ""
    echo "❌ FAILED: The upload failed. Please make sure your token is correct and has the 'repo' checkbox checked."
fi
