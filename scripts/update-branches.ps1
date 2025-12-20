<#
.SYNOPSIS
  Update remote branches by pushing `main` and syncing to `chore/remove-stale-docs`.

.DESCRIPTION
  Commits working-tree changes (if a commit message is provided), pushes `main`, and then updates
  `chore/remove-stale-docs` to match `main` using `--force-with-lease` (or `--force` with -Force).

.PARAMETER Message
  Commit message to use for committing staged/unstaged changes. If omitted and there are changes,
  you'll be prompted to enter a message. Leave blank to skip committing.

.PARAMETER Force
  Use `--force` instead of `--force-with-lease` when updating the remote branch.

EXAMPLE
  .\update-branches.ps1 -Message "chore: sync branches"

  .\update-branches.ps1 -Force
#>

param(
    [string]$Message = "",
    [switch]$Force
)

function Exec-Git {
    param([string]$Args)
    git $Args
    if ($LASTEXITCODE -ne 0) {
        throw "git $Args failed with exit code $LASTEXITCODE"
    }
}

try {
    $gitRoot = (& git rev-parse --show-toplevel) 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $gitRoot) {
        Write-Error "Not inside a git repository. Run this script from within the repository tree."; exit 1
    }
    Set-Location $gitRoot

    $status = git status --porcelain
    if ($status) {
        if (-not $Message) {
            $Message = Read-Host "Working tree has changes. Enter commit message (leave blank to skip commit)"
        }

        if ($Message) {
            Write-Output "Committing changes with message: $Message"
            Exec-Git "add -A"
            Exec-Git "commit -m `"$Message`""
        } else {
            Write-Output "Skipping commit as no message provided. Proceeding to push existing commits."
        }
    } else {
        Write-Output "No working-tree changes detected."
    }

    Write-Output "Pushing 'main' to origin..."
    Exec-Git "push origin main"

    if ($Force.IsPresent) {
        Write-Output "Updating 'chore/remove-stale-docs' from 'main' using --force"
        Exec-Git "push origin main:chore/remove-stale-docs --force"
    } else {
        Write-Output "Updating 'chore/remove-stale-docs' from 'main' using --force-with-lease"
        Exec-Git "push origin main:chore/remove-stale-docs --force-with-lease"
    }

    Write-Output "Done. Remote branches updated."
} catch {
    Write-Error "Operation failed: $_"
    exit 1
}
