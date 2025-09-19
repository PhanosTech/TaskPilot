# TaskPilot: Compilation and Setup Guide

This guide provides instructions on how to set up the TaskPilot project on your local machine for development and how to build it for production.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   [Node.js](https://nodejs.org/) (version 18.x or later recommended)
-   [npm](https://www.npmjs.com/) (which comes with Node.js)

## Installation

1.  **Clone the Repository**:
    If you have the project files, navigate into the project's root directory.

2.  **Install Dependencies**:
    Open your terminal in the project's root directory and run the following command to install all the required packages:
    ```bash
    npm install
    ```

## Running the Development Server

To run the application in development mode with hot-reloading, use the following command:

```bash
npm run dev
```

This will start the development server, typically on `http://localhost:9002`. You can now open this URL in your web browser to see the application. Any changes you make to the source code will be automatically reflected in the browser.

## Building for Production

When you are ready to deploy the application, you need to create an optimized production build. Run the following command:

```bash
npm run build
```

This command compiles the TypeScript code, bundles the assets, and optimizes the application for the best performance. The output will be placed in the `.next` directory.

## Running in Production Mode

After creating a production build, you can start the application in production mode with this command:

```bash
npm run start
```

This starts a production-ready server that serves the optimized application. It's much more performant than the development server and is the recommended way to run the app in a live environment.
