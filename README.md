
# Inventory & Sticker System for Jaris & K

This is a self-hosted inventory management system built with a Node.js backend and a SQLite database. It is designed for internal company use to track items, manage their users and condition, and generate printable QR code stickers. The entire application can be packaged into a standalone executable for easy distribution to employees.

## Features

-   **Add, Edit, and Delete Items:** Full CRUD (Create, Read, Update, Delete) functionality for your inventory.
    
-   **Search and Filter:** Quickly find items with a powerful search that supports ID, text, condition, and date range filtering.
    
-   **Pagination:** The inventory list is paginated for easy navigation.
    
-   **Sticker Generation:** Create printable stickers for any item, complete with a QR code and your brand logo.
    
-   **Export to Excel:** Download a beautifully formatted Excel report of your entire inventory, with color-coded conditions and autofitted columns.
    
-   **Self-Hosted:** You have full control over your data, which is stored in a local `inventory.db` file.
    
-   **Cross-Platform Executables:** The application can be packaged into a single executable file for both Windows and Linux.
    
-   **Docker Support:** Includes a `Dockerfile` for easy containerization and deployment on internal servers.
    
-   **GitHub Actions:** Automates the process of building and publishing the Docker image to a private GitHub Container Registry.
    

## Prerequisites

-   [Node.js](https://nodejs.org/ "null") (version 18 or higher is recommended)
    
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/ "null") (only if you want to use the Docker features)
    

## Local Setup and Running

Follow these steps to run the application on your local machine for development.

1.  **Prepare Project Files:** Ensure you have the project files (`server.js`, `index.html`, `database.js`, etc.) in a single folder on your computer.
    
2.  **Install Dependencies:** Open a terminal in your project folder and run:
    
    ```
    npm install
    
    ```
    
3.  **Start the Server:**
    
    ```
    npm run start
    
    ```
    
    The server will be running at `http://localhost:3000`.
    
4.  **Use the Application:** Open the `index.html` file in your web browser.
    

## Building the Executable

You can package the entire application into a single executable file for distribution.

1.  **Run the Build Command:** In your terminal, from the project's root directory, run:
    
    ```
    npm run build
    
    ```
    
2.  **Find Your Executables:** This command will create a new `dist` folder containing your executables:
    
    -   `inventory-system.exe` (for Windows)
        
    -   `inventory-system` (for Linux)
        
3.  **Run the Executable:**
    
    -  On Windows, double-click `inventory-system.exe`.
        
    -   On Linux, you may first need to make it executable (`chmod +x inventory-system`) and then run it (`./inventory-system`).
        

The application will be available in your browser at `http://localhost:3000`, and the `inventory.db` file will be created in the same `dist` folder.

## Docker Instructions

### Building the Docker Image

To build the Docker image, run the following command from the project's root directory:

```
docker build -t inventory-system .

```

### Running the Docker Container

To run the application inside a Docker container, use this command:

```
docker run -p 3000:3000 -v $(pwd)/data:/app/data inventory-system

```

-   The `-p 3000:3000` flag maps the container's port to your local machine.
    
-   The `-v $(pwd)/data:/app/data` flag creates a `data` folder in your project directory and links it to the container. This is where your `inventory.db` file will be stored, ensuring your data is safe.
    

## GitHub Actions: Automated Docker Builds

This repository is configured with a GitHub Action that will automatically build and publish the Docker image to the GitHub Container Registry (GHCR) every time you push a change to the `main` or `master` branch.

To make this work, you need to add a single secret to your private repository:

1.  **Create a Personal Access Token (PAT):**
    
    -   Go to your GitHub **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
        
    -   Generate a new token with the **`write:packages`** scope.
        
2.  **Add the Secret to Your Repository:**
    
    -   In your GitHub repository, go
