# ================================
# Étape 1 : Build Maven
# ================================
FROM maven:3.9.2-eclipse-temurin-17 AS build
WORKDIR /app

# Copier uniquement le pom.xml pour profiter du cache Docker
COPY pom.xml .

# Télécharger les dépendances sans le code source pour accélérer les builds futurs
RUN mvn dependency:go-offline

# Copier le code source
COPY src ./src

# Construire le JAR sans exécuter les tests pour Render
RUN mvn clean package -DskipTests

# ================================
# Étape 2 : Image finale
# ================================
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copier le JAR généré depuis l'étape build
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Exposer le port utilisé par Spring Boot
EXPOSE 8080

# Démarrer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
