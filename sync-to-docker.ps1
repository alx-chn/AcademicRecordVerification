Write-Host "Syncing AcademicRecordVerification to Docker container..." -ForegroundColor Cyan

# Copy the files to Docker
Write-Host "Copying files to Docker..." -ForegroundColor Yellow
docker cp . fite2010-lab1:/usr/app/AcademicRecordVerification
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error copying files to Docker" -ForegroundColor Red
    exit 1
}

Write-Host "Sync completed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. docker exec -it fite2010-lab1 bash" -ForegroundColor Cyan
Write-Host "2. cd /usr/app/AcademicRecordVerification" -ForegroundColor Cyan
Write-Host "3. npm install" -ForegroundColor Cyan
Write-Host "4. npx hardhat compile" -ForegroundColor Cyan
Write-Host "5. npx hardhat run scripts/deploy.js --network localhost" -ForegroundColor Cyan 