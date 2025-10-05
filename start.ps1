# start.ps1

# Lire le fichier dev.env ligne par ligne
Get-Content .\dev.env | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Définir la variable d'environnement pour la session PowerShell
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Lancer le backend
cd .\backend
mvn spring-boot:run
