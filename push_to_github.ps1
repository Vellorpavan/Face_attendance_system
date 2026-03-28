# ----------------------------------------------------
# SVPCET AI Attendance - Upload to GitHub Helper Script (Windows)
# ----------------------------------------------------

Clear-Host
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Before we can upload to GitHub, you need a Personal Access Token." -ForegroundColor Green
Write-Host "GitHub does not allow normal passwords anymore." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "👉 How to get your token:"
Write-Host "1. Open your browser and go to: https://github.com/settings/tokens/new"
Write-Host "2. Fill out the form (e.g. Note: Windows Push)"
Write-Host "3. Scroll down and check the very first box that says 'repo' (Full control of private repositories)"
Write-Host "4. Scroll all the way to the bottom and click 'Generate Token'"
Write-Host "5. Copy that long string of text!"
Write-Host ""

# Ask user for token
$token = Read-Host -AsSecureString "Paste your Token here (it will NOT show up when you type, this is normal)"
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))

if ([string]::IsNullOrWhiteSpace($tokenPlain)) {
    Write-Host "❌ Error: You didn't enter a token. Please run the script again." -ForegroundColor Red
    exit
}

Write-Host "🔄 Uploading files to GitHub..." -ForegroundColor Cyan

# Set the URL with the token
$remoteUrl = "https://Janardhan7330:${tokenPlain}@github.com/Janardhan7330/collage_ai.git"
git remote set-url origin $remoteUrl

# Push the code
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your code is now fully uploaded to GitHub!" -ForegroundColor Green
    Write-Host "Link: https://github.com/Janardhan7330/collage_ai" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ FAILED: The upload failed. Please make sure your token is correct and has the 'repo' checkbox checked." -ForegroundColor Red
}
