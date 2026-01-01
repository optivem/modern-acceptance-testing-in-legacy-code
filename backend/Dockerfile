# Build stage
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Install CA certificates explicitly
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Copy Gradle wrapper and config
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Verify environment
RUN java -version
RUN ./gradlew --version

# Warm dependency cache
RUN ./gradlew dependencies --no-daemon || true

# Copy sources
COPY src ./src

# Build
RUN ./gradlew build --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]