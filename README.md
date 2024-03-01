# Pinterest Clone using Node and ejs

## Description

This is a Pinterest Clone using Node and ejs. It is a simple web application that allows users to upload images and view them in a grid also users can like on other posts. The images are stored in a MongoDB database.

## Setup

1. Clone the repository
2. Run `npm install` to install the dependencies
    ** Note: Create a `.env` file in the root directory and add the following environment variables:
        ```./env
        DB_URL=your_mongo_uri
        ```
3. Run `npm start` to start the server
4. Open your browser and go to `http://localhost:3000`

## Docker Setup

1. Clone the repository

    ** Note: Create a `.env` file in the root directory and add the following environment variables:

    ```./env
    DB_URL=your_mongo_uri
    ```

2. Run `docker compose up --build` to start the server

## Technologies

- Node.js
- Express.js
- EJS
- MongoDB
- Mongoose
- Multer
