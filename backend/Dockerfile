# Build stage
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Update CA certificates and install debugging tools
RUN apt-get update && \
    apt-get install -y ca-certificates openssl curl && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Test Maven Central connectivity
RUN curl -v --connect-timeout 10 https://repo.maven.apache.org/maven2/ || true

# Copy Gradle wrapper and config
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY init.gradle ./

# Copy sources
COPY src ./src

# Set JVM options for TLS and networking
ENV JAVA_TOOL_OPTIONS="-Dhttps.protocols=TLSv1.2,TLSv1.3 -Djdk.tls.client.protocols=TLSv1.2,TLSv1.3 -Djavax.net.ssl.sessionCacheSize=1000"

# Build with init script for proper TLS configuration and retry logic
RUN ./gradlew build --no-daemon --init-script init.gradle \
    -Dorg.gradle.daemon=false \
    -Dhttp.socketTimeout=60000 \
    -Dhttp.connectionTimeout=60000 \
    -Dhttps.protocols=TLSv1.2,TLSv1.3 \
    -Djdk.tls.client.protocols=TLSv1.2,TLSv1.3

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]