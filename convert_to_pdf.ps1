# PowerShell script to convert markdown to PDF using pandoc
# Run this script with Administrator privileges

# Check if pandoc is installed
if (!(Get-Command pandoc -ErrorAction SilentlyContinue)) {
    Write-Host "Pandoc is not installed. Please install it first:" -ForegroundColor Yellow
    Write-Host "  Run PowerShell as Administrator and execute:" -ForegroundColor Cyan
    Write-Host "  choco install pandoc -y" -ForegroundColor Cyan
    Write-Host "  choco install miktex -y" -ForegroundColor Cyan
    exit
}

# Convert markdown to PDF with custom settings
$inputFile = "TESTING_DOCUMENTATION.md"
$outputFile = "TESTING_DOCUMENTATION.pdf"

Write-Host "Converting $inputFile to PDF..." -ForegroundColor Green

pandoc $inputFile -o $outputFile `
    --pdf-engine=xelatex `
    -V geometry:margin=1in `
    -V fontsize=11pt `
    -V documentclass=article `
    -V classoption=twocolumn `
    --toc `
    --number-sections `
    -V colorlinks=true `
    -V linkcolor=blue `
    -V urlcolor=blue `
    -V toccolor=blue

if ($LASTEXITCODE -eq 0) {
    Write-Host "PDF generated successfully: $outputFile" -ForegroundColor Green
} else {
    Write-Host "Error generating PDF. Make sure MiKTeX or TeX Live is installed." -ForegroundColor Red
    Write-Host "Install MiKTeX: choco install miktex -y" -ForegroundColor Yellow
}
