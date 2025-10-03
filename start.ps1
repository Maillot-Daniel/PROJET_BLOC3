# Charger les variables d'environnement depuis .env
Get-Content .env | ForEach-Object {
    if ($_ -match "^\s*([^#][\w]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Lancer l'application Spring Boot avec Maven
./mvnw spring-boot:run