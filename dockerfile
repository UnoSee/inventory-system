# Stage 1: Build the application
# We use a specific Node.js version to ensure consistency.
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and install dependencies
# We copy package.json first to take advantage of Docker's layer caching.
COPY package.json .
RUN npm install

# Copy all the other project files
COPY . .

# Run the build script to create the executables
# Note: We are building for Linux inside this Docker container.
RUN npm run build


# Stage 2: Create the final, lightweight image
# We use a minimal base image to keep the final image size small.
FROM alpine:latest

# Set the working directory for the final image
WORKDIR /app

# Copy the built executables from the 'builder' stage
COPY --from=builder /app/dist/inventory-system .

# Copy the wasm file needed by sql.js
COPY --from=builder /app/sql-wasm.wasm .

# Expose the port the server will run on
EXPOSE 3000

# The command to run when the container starts
CMD ["./inventory-system"]
