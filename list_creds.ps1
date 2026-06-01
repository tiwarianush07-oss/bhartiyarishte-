[void][System.Reflection.Assembly]::LoadWithPartialName("System.Security")
try {
    $vault = New-Object Windows.Security.Credentials.PasswordVault
    $creds = $vault.RetrieveAll()
    Write-Output "Found $($creds.Count) credentials in Vault:"
    foreach ($c in $creds) {
        try {
            $c.RetrievePassword()
            Write-Output "Resource: $($c.Resource) | User: $($c.UserName) | Password: $($c.Password)"
        } catch {
            Write-Output "Resource: $($c.Resource) | User: $($c.UserName) | (Failed to retrieve password)"
        }
    }
} catch {
    Write-Output "Error accessing PasswordVault: $($_.Exception.Message)"
}
