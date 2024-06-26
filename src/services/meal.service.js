const database = require('../database/database');
const logger = require('../util/logger');

let mealService = {
    create: (meal, callback) => {
        const query = 'INSERT INTO meals (name, description, price) VALUES (?, ?, ?)';
        database.query(query, [meal.name, meal.description, meal.price], (error, results) => {
            if (error) {
                logger.error('Error creating meal:', error);
                return callback({
                    status: 500,
                    message: 'Failed to create meal'
                });
            }
            logger.info('Meal created:', results);
            callback(null, {
                status: 200,
                message: 'Meal created successfully',
                data: { mealId: results.insertId }
            });
        });
    },

    getAll: (callback) => {
        const query = 'SELECT * FROM meals';
        database.query(query, (error, results) => {
            if (error) {
                logger.error('Error fetching meals:', error);
                return callback({
                    status: 500,
                    message: 'Failed to fetch meals'
                });
            }
            logger.info('Meals fetched:', results);
            callback(null, {
                status: 200,
                message: 'Meals fetched successfully',
                data: results
            });
        });
    },

    getById: (mealId, callback) => {
        const query = 'SELECT * FROM meals WHERE id = ?';
        database.query(query, [mealId], (error, results) => {
            if (error) {
                logger.error('Error fetching meal:', error);
                return callback({
                    status: 500,
                    message: 'Failed to fetch meal'
                });
            }
            if (results.length === 0) {
                return callback({
                    status: 404,
                    message: 'Meal not found'
                });
            }
            logger.info('Meal fetched:', results[0]);
            callback(null, {
                status: 200,
                message: 'Meal fetched successfully',
                data: results[0]
            });
        });
    },

    update: (mealId, meal, callback) => {
        const query = 'UPDATE meals SET name = ?, description = ?, price = ? WHERE id = ?';
        database.query(query, [meal.name, meal.description, meal.price, mealId], (error, results) => {
            if (error) {
                logger.error('Error updating meal:', error);
                return callback({
                    status: 500,
                    message: 'Failed to update meal'
                });
            }
            if (results.affectedRows === 0) {
                return callback({
                    status: 404,
                    message: 'Meal not found'
                });
            }
            logger.info('Meal updated:', results);
            callback(null, {
                status: 200,
                message: 'Meal updated successfully',
                data: { mealId: mealId }
            });
        });
    },

    delete: (mealId, callback) => {
        const query = 'DELETE FROM meals WHERE id = ?';
        database.query(query, [mealId], (error, results) => {
            if (error) {
                logger.error('Error deleting meal:', error);
                return callback({
                    status: 500,
                    message: 'Failed to delete meal'
                });
            }
            if (results.affectedRows === 0) {
                return callback({
                    status: 404,
                    message: 'Meal not found'
                });
            }
            logger.info('Meal deleted:', results);
            callback(null, {
                status: 200,
                message: 'Meal deleted successfully',
                data: { mealId: mealId }
            });
        });
    }
};

module.exports = mealService;
