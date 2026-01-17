# Import n8n workflow via API
param(
  [string]$N8nUrl = "http://localhost:5678",
  [string]$WorkflowFile = "n8n/JFinder_API_NoPostgres.json"
)

Write-Host "🔄 Importing n8n workflow..." -ForegroundColor Cyan

# Read workflow file
$workflowContent = Get-Content $WorkflowFile -Raw | ConvertFrom-Json

# n8n API endpoint for workflow import
$importUrl = "$N8nUrl/api/v1/workflows"

try {
  # Import workflow
  $response = Invoke-RestMethod -Uri $importUrl -Method Post -Body ($workflowContent | ConvertTo-Json -Depth 20) -ContentType "application/json"

  Write-Host "✅ Workflow imported successfully!" -ForegroundColor Green
  Write-Host "   Workflow ID: $($response.id)" -ForegroundColor Gray
  Write-Host "   Workflow Name: $($response.name)" -ForegroundColor Gray

  # Activate workflow
  $activateUrl = "$N8nUrl/api/v1/workflows/$($response.id)/activate"
  Invoke-RestMethod -Uri $activateUrl -Method Post

  Write-Host "✅ Workflow activated!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Test với: http://localhost:5678/webhook/search?limit=5" -ForegroundColor Yellow
}
catch {
  Write-Host "❌ Error importing workflow:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "⚠️  Cần import thủ công qua n8n UI:" -ForegroundColor Yellow
  Write-Host "   1. Mở http://localhost:5678" -ForegroundColor Gray
  Write-Host "   2. Click 'Import from file'" -ForegroundColor Gray
  Write-Host "   3. Chọn file: n8n/JFinder_API_NoPostgres.json" -ForegroundColor Gray
  Write-Host "   4. Click 'Save' và 'Activate'" -ForegroundColor Gray
}
