# recipe-app-backend
This is a Express JS backend application I created for practice. It is a simple recipe logging API that allows users to create, read, update, and delete recipes. The application uses PostgreSQL as the database.

**Author**: Jason You

## Steps for use
1. Clone the repository
2. Run `npm install` to install the dependencies
3. Install PostgreSQL and create a database using the following command:
```
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    photo TEXT NOT NULL
);
```
4. Create a `.env` file in the root directory and add the following environment variables:
```
DB_USER = {your database username} (default is postgres)
DB_PASSWORD = {your database password} 
DB_HOST = {your database host} (default is localhost)
DB_PORT = {your database port} (default is 5432)
DB_DATABASE = {your database name}
```

5. Run `npm start` to start the server

## API Endpoints
- `all-recipes` - GET request to get all recipes
- `recipe/{id}` - GET request to get a recipe by id
- `create-recipe` - POST request to create a recipe
- `update-recipe/{id}` - PUT request to update a recipe by id
- `delete-recipe/{id}` - DELETE request to delete a recipe by id