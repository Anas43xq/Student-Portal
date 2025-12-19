<#
Generates an ED25519 SSH keypair for use as a deploy key.
Usage:
  - To generate interactively (recommended):
      .\generate_deploy_key.ps1
  - To generate with no passphrase (for CI use):
      .\generate_deploy_key.ps1 -NoPassphrase
  - To pick a custom name:
      .\generate_deploy_key.ps1 -KeyName my_key_name

The script will:
 - Ensure ~/.ssh exists
 - Run ssh-keygen to create the keypair under ~/.ssh\<KeyName>
 - Print the public key and copy it to the clipboard (Windows)
 - Show the next steps to add the public key as a repo Deploy Key and add the private key to GitHub Secrets

Security notes:
 - Keep the private key private. Do NOT commit it to the repository.
 - For CI, add the private key as a GitHub Actions secret (e.g., DEPLOY_KEY) and add the public key as a Deploy Key with write access.
#>

param(
    [string]$KeyName = "student_portal_deploy",
    [switch]$NoPassphrase
)

$sshDir = Join-Path $env:USERPROFILE ".ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -Path $sshDir -ItemType Directory | Out-Null
    Write-Host "Created directory: $sshDir"
}

$keyPath = Join-Path $sshDir $KeyName

if (Test-Path $keyPath) {
    Write-Host "A key named '$KeyName' already exists at $keyPath" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite existing key? (type 'yes' to confirm)"
    if ($overwrite -ne 'yes') {
        Write-Host "Aborting. Choose a different key name or move/remove the existing key." -ForegroundColor Red
        exit 1
    }
}

$comment = "deploy-key for Student-Portal"

if ($NoPassphrase) {
    Write-Host "Generating key with empty passphrase..." -ForegroundColor Cyan
    ssh-keygen -t ed25519 -f $keyPath -C $comment -N "" | Out-Null
} else {
    Write-Host "Generating key (you will be prompted for a passphrase; press Enter for no passphrase)..." -ForegroundColor Cyan
    ssh-keygen -t ed25519 -f $keyPath -C $comment
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ssh-keygen failed (exit code: $LASTEXITCODE). Check that OpenSSH is available in your PATH." -ForegroundColor Red
    exit 1
}

$pubKeyPath = "$keyPath.pub"
if (Test-Path $pubKeyPath) {
    $pubKey = Get-Content $pubKeyPath -Raw
    Write-Host "\nPublic key (copied to clipboard):\n" -ForegroundColor Green
    Write-Host $pubKey
    try {
        # Copy to clipboard on Windows
        Set-Clipboard -Value $pubKey
        Write-Host "Public key copied to clipboard." -ForegroundColor Green
    } catch {
        Write-Host "Could not copy to clipboard automatically. Please copy $pubKeyPath contents manually." -ForegroundColor Yellow
    }

    Write-Host "\nNext steps:" -ForegroundColor Cyan
    Write-Host "1) Go to your repository → Settings → Deploy keys → Add deploy key." -ForegroundColor White
    Write-Host "   - Title: e.g. 'deploy-key (CI / actions)'." -ForegroundColor White
    Write-Host "   - Paste the public key and check 'Allow write access' if you want CI or this key to push." -ForegroundColor White
    Write-Host "2) (Optional - for CI) Copy the private key to a GitHub secret named 'DEPLOY_KEY':" -ForegroundColor White
    Write-Host "   - Get-Content -Raw '$keyPath' | Set-Clipboard" -ForegroundColor Magenta
    Write-Host "   - Then paste into GitHub repo → Settings → Secrets → Actions → New repository secret (name: DEPLOY_KEY)." -ForegroundColor White
    Write-Host "3) Use the workflow snippet in '.github/workflows' to load the key and push. (I can add this file if you want.)" -ForegroundColor White
} else {
    Write-Host "Public key not found at $pubKeyPath" -ForegroundColor Red
}

Write-Host "Done." -ForegroundColor Green
