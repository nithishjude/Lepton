$url = "https://github.com/foundry-rs/foundry/releases/download/v1.7.1/foundry_v1.7.1_win32_amd64.zip"
$zip = "D:\lepton\foundry.zip"
$dir = "D:\lepton\foundry-bin"

Write-Host "Downloading Foundry v1.7.1 for Windows..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Write-Host "Downloaded. Extracting..."

New-Item -ItemType Directory -Force -Path $dir | Out-Null
Expand-Archive -Path $zip -DestinationPath $dir -Force
Write-Host "Extracted to $dir"

# Add to user PATH permanently
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$dir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$dir;$userPath", "User")
    Write-Host "Added $dir to user PATH"
}

# Test it
$env:PATH = "$dir;$env:PATH"
$version = & "$dir\forge.exe" --version
Write-Host "forge version: $version"
