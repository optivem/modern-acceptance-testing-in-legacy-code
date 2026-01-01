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

# Warm dependency cache with retry logic (handles transient network failures)
RUN for i in 1 2 3; do \
      echo "Attempt $i: Downloading dependencies..." && \
      ./gradlew dependencies --no-daemon && break || \
      (echo "Attempt $i failed, retrying..." && sleep 5); \
    done

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