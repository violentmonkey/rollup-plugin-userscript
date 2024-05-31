# Run a shell script with the same name as this script using WSL.
& 'wsl' '--exec' ('./{0}' -f [System.Io.Path]::GetFileNameWithoutExtension($PSCommandPath)) $args