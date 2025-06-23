$filePath = "checkout.component.html"
$content = Get-Content $filePath -Raw
# Replace the pattern with the special vertical tab character
$newContent = $content -replace "Amount:\s+[\x0B]?9\{\{", "Amount: ₹{{"
Set-Content $filePath -Value $newContent -NoNewline
Write-Host "Currency fix applied successfully"
