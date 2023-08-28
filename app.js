/**
 * Written by: Jason You
 * This file contains the server-side code for the Recipe Server
 * It handles the following requests:
 * 1. GET request to get all recipes
 * 2. GET request to get a specific recipe by id
 * 3. POST request to create a recipe
 * 4. PUT request to update a recipe by id
 * 5. PATCH request to update a recipe by id
 * 6. DELETE request to delete a recipe by id
 * Last modified on 2023-08-28
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const { Pool } = require('pg');
require('dotenv').config(); // to use .env file

const app = express();
const port = process.env.PORT || 8080;

// env variables
const db_user = process.env.DB_USER;
const db_host = process.env.DB_HOST;
const db_database = process.env.DB_DATABASE;
const db_password = process.env.DB_PASSWORD;
const db_port = process.env.DB_PORT;

// PostgreSQL Instance Connection
const pool = new Pool({
	user: db_user,
	host: db_host,
	database: db_database,
	password: db_password,
	port: db_port,
});

// Multer library is used to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Use JSON for the body of requests (POST, PUT, PATCH)
app.use(express.json());

// Let the user know that the server is running
app.get('/', (req, res) => {
	res.send("Recipe Server is running");
});

/**
 * The /all-recipes GET endpoint
 * This endpoint will query and return all recipes found from the database
 */
app.get('/all-recipes', (req, res) => {
	pool.query('SELECT * FROM recipes', (error, result) => {
		if (error) {
			console.error('Error getting recipes:', error);
			res.status(500).send('Error getting recipes');
		} else {
			res.send(result.rows);
		}
	});
});


/**
 * The /recipe/:id GET endpoint
 * This endpoint will query and return a recipe found from the database by id
 */
app.get('/recipe/:id', (req, res) => {
	const { id } = req.params;
	pool.query('SELECT * FROM recipes WHERE id = $1', [id], (error, result) => {
		if (error) {
			console.error('Error getting recipe:', error);
			res.status(500).send('Error getting recipe');
		} else {
			if (result.rows.length === 0) {
				res.send(`No recipe found with id ${id}`);
			}

			res.send(result.rows[0]);
		}
	});
});

/**
 * The /create-recipe POST endpoint
 * This endpoint will create a recipe in the database with the given name, description, and photo.
 * It will also return the id of the recipe that was created.
 */
app.post('/create-recipe', upload.single('photo'), async (req, res) => {
	try {
		const { name, description, photo } = req.body;
		//const photo = req.file.buffer.toString('base64');

		const client = await pool.connect();
		const result = await client.query(
			'INSERT INTO recipes (name, description, photo) VALUES ($1, $2, $3) RETURNING id',
			[name, description, photo]
		);
		const recipeId = result.rows[0].id;
		console.log('Inserted with ID:', recipeId);
		client.release();

		//res.redirect('/');
		res.send('Recipe created successfully');
	} catch (error) {
		console.error('Error creating recipe:', error);
		res.status(500).send('Error creating recipe');
	}
});

/**
 * The /update-recipe PUT endpoint
 * This endpoint will update a recipe in the database with the given id, name, description, and photo.
 * If the id does not exist, it will create a new recipe with the given id, name, description, and photo.
 * It will also return the id of the recipe that was updated or created.
 */
app.put('/update-recipe/:id', upload.single('photo'), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, photo } = req.body;

		const client = await pool.connect();
		const result = await client.query(
			'UPDATE recipes SET name = $1, description = $2, photo = $3 WHERE id = $4',
			[name, description, photo, id]
		);
		try {
			const recipeId = result.rows[0].id;
			console.log('Updated with ID:', recipeId);
		} catch (error) {
			console.log('ID could not be found, creating...');
			const result = await client.query(
				'INSERT INTO recipes (name, description, photo) VALUES ($1, $2, $3) RETURNING id',
				[name, description, photo]
			);
			const recipeId = result.rows[0].id;
			console.log(`Could not find ID ${id}. Inserted with ID:`, recipeId);
		}
		client.release();
		res.send('Recipe updated successfully');
	} catch (error) {
		console.error('Error updating recipe:', error);
		res.status(500).send('Error updating recipe');
	}
});

/**
 * The /patch-recipe PATCH endpoint
 * This endpoint will update a recipe in the database with a given id, name, description, and photo.
 */
app.patch('/patch-recipe/:id', upload.single('photo'), async (req, res) => {
	try {
		const { id } = req.params;
		const vals = req.body;
		const client = await pool.connect();
		// get the JSON values of the req.body from above vals const and find which of the field values 'name', 'description', 'photo' are not null
		// The returned req.body is mapped to an array of values that are not null, and then a
		// string of the keys that are not null is created so that it can be used in the query to the db
		const keys = Object.keys(vals).filter((key) => vals[key] !== null);
		const values = keys.map((key) => vals[key]);
		const keysWithId = keys.map((key) => `${key} = $${keys.indexOf(key) + 1}`);
		const keysWithIdString = keysWithId.join(', ');
		const valuesString = values.join(', ');
		const keysWithIdStringWithId = keysWithIdString + ` WHERE id = ${id}`;
		// create a string of the values that are not null with the id
		const valuesStringWithId = valuesString + `, ${id}`;

		const result = await client.query(
			`UPDATE recipes SET ${keysWithIdStringWithId}`,
			values
		);
		client.release();
		res.send('Recipe patched successfully');

	} catch (error) {
		console.error('Error updating recipe:', error);
		res.status(500).send('Error updating recipe');
	}
});

/**
 * The /delete-recipe DELETE endpoint
 * This endpoint will delete a recipe in the database with the given id.
 * If the id cannot be found or if there is any other error a 500 error will be returned.
 */
app.delete('/delete-recipe/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const client = await pool.connect();
		const result = await client.query('DELETE FROM recipes WHERE id = $1', [id]);
		console.log('Deleted with ID:', id);
		client.release();
		res.send('Recipe deleted successfully');
	} catch (error) {
		console.error('Error deleting recipe:', error);
		res.status(500).send('Error deleting recipe');
	}
});


// Start the server on the specified port
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
