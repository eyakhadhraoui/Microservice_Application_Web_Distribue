# Eureka Server (Spring Boot 4 — JDK 21), port 8761 par défaut.
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=10 -Dmaven.wagon.http.retryHandler.requestSentEnabled=true -Dmaven.wagon.httpconnectionManager.ttlSeconds=120"
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src ./src
RUN chmod +x mvnw && ./mvnw -B -DskipTests clean package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/eureka-server.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
