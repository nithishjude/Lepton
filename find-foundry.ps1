$release = Invoke-RestMethod -Uri "https://api.github.com/repos/foundry-rs/foundry/releases/latest" -UseBasicParsing
$assets = $release.assets
foreach ($asset in $assets) {
    if ($asset.name -like "*windows*" -or $asset.name -like "*win*") {
        Write-Host "FOUND: $($asset.name)"
        Write-Host "URL: $($asset.browser_download_url)"
    }
}
