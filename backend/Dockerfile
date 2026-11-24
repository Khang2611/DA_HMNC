# ==============================================================================
# Multi-stage Dockerfile for VinaTrust Bank Backend (Java 21 + Spring Boot 3)
# ==============================================================================

# --- Stage 1: Build & Package ---
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Pre-fetch Maven dependencies for better caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Compile and package application JAR (skipping unit tests during image build)
RUN mvn clean package -DskipTests -B

# --- Stage 2: Minimal Runtime Environment ---
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Run as a non-privileged user for security compliance
RUN addgroup -S vinatrust && adduser -S vinatrust -G vinatrust

# Copy compiled JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Change ownership of application directory
RUN chown -R vinatrust:vinatrust /app

USER vinatrust:vinatrust

# Expose Spring Boot HTTP port
EXPOSE 8080

# Configure JVM flags optimized for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

