# Use a Gradle build image to compile the project
FROM gradle:8-jdk21 AS build
WORKDIR /app

# Copy Gradle files first for caching dependencies
COPY gradle gradle
COPY gradlew .
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# Copy the rest of the project
COPY . .

# Build the JAR file
RUN ./gradlew clean bootJar --no-daemon

# Use a lightweight image to run the JAR
FROM openjdk:21-jdk-slim
WORKDIR /app

# Copy only the built JAR file from the previous stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
