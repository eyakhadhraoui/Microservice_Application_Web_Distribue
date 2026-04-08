# Microservice dossier médical (Spring Boot 3, port 8089 par défaut).
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=10 -Dmaven.wagon.http.retryHandler.requestSentEnabled=true -Dmaven.wagon.httpconnectionManager.ttlSeconds=120"
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src ./src
RUN chmod +x mvnw && ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8089
ENTRYPOINT ["java", "-jar", "app.jar"]
