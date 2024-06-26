const database = require('../dao/mysql-db')
const logger = require('../util/logger');

let mealService = {
    create: (meal, callback) => {
        const { isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes } = meal;
        const query = 'INSERT INTO meal (isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        database.query(query, [isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes], (error, results) => {
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
        const query = 'SELECT * FROM meal'; 
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
        const query = 'SELECT * FROM meal WHERE id = ?';
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
        const { isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes } = meal;
        let updateFields = [];
        let updateValues = [];
    
        // Only add fields to the update query if they are provided
        if (isActive !== undefined) {
            updateFields.push('isActive = ?');
            updateValues.push(isActive);
        }
        if (isVega !== undefined) {
            updateFields.push('isVega = ?');
            updateValues.push(isVega);
        }
        if (isVegan !== undefined) {
            updateFields.push('isVegan = ?');
            updateValues.push(isVegan);
        }
        if (isToTakeHome !== undefined) {
            updateFields.push('isToTakeHome = ?');
            updateValues.push(isToTakeHome);
        }
        if (maxAmountOfParticipants !== undefined) {
            updateFields.push('maxAmountOfParticipants = ?');
            updateValues.push(maxAmountOfParticipants);
        }
        if (price !== undefined) {
            updateFields.push('price = ?');
            updateValues.push(price);
        }
        if (imageUrl !== undefined) {
            updateFields.push('imageUrl = ?');
            updateValues.push(imageUrl);
        }
        if (cookId !== undefined) {
            updateFields.push('cookId = ?');
            updateValues.push(cookId);
        }
        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (allergenes !== undefined) {
            updateFields.push('allergenes = ?');
            updateValues.push(allergenes);
        }
    
        // Ensure that at least one field is being updated
        if (updateFields.length === 0) {
            return callback({
                status: 400,
                message: 'No valid fields to update'
            });
        }
    
        // Construct the query dynamically
        const updateQuery = `UPDATE meal SET ${updateFields.join(', ')} WHERE id = ?`;
        updateValues.push(mealId);
    
        // Execute the query
        database.query(updateQuery, updateValues, (error, results) => {
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
        const query = 'DELETE FROM meal WHERE id = ?';
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
