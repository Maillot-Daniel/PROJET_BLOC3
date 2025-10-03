# Utilise OpenJDK 17 slim
FROM openjdk:17-jdk-slim

# Crée le répertoire de travail dans le conteneur
WORKDIR /app

# Copie le JAR généré par Maven dans le conteneur
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose le port 8080 pour Render
EXPOSE 8080

# Commande pour démarrer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
