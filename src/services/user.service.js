const database = require('../dao/inmem-db')
const logger = require('../util/logger')

const userService = {
    create: (user, callback) => {
        logger.info('create user', user);
        // Check if the email already exists
        const existingUser = database._data.find(u => u.emailAdress === user.emailAdress);
        if (existingUser) {
            callback({ status: 400, message: 'Error: Email already exists.', data: {} }, null);
        } else {
            // Proceed with adding the user if email is unique
            database.add(user, (err, data) => {
                if (err) {
                    logger.info('error creating user: ', err.message || 'unknown error');
                    callback(err, null);
                } else {
                    logger.trace(`User created with id ${data.id}.`);
                    callback(null, {
                        message: `User created with id ${data.id}.`,
                        data: data
                    });
                }
            });
        }
    },

    getAll: (callback) => {
        logger.info('getAll')
        database.getAll((err, data) => {
            if (err) {
                callback(err, null)
            } else {
                callback(null, {
                    message: `Found ${data.length} users.`,
                    data: data
                })
            }
        })
    },

    getById: (userId, callback) => {
        logger.info('getById', userId);
        database.getById(userId, (err, data) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, {
                    message: `User with ID ${userId} found.`,
                    data: data
                })
            }
        })
    },

    deleteById: (userId, callback) => {
        logger.info('deleteById', userId);
        database.deleteById(userId, (err, data) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, {
                    message: `User with ID ${userId} deleted successfully.`,
                    data: data
                });
            }
        });
    },

    updateById: (userId, newData, callback) => {
        logger.info('updateById', userId);
        database.getById(userId, (err, user) => {
            if (err) {
                callback(err, null);
            } else {
                // Update user data with new information
                user.firstName = newData.firstName || user.firstName;
                user.lastName = newData.lastName || user.lastName;
                user.emailAdress = newData.emailAdress || user.emailAdress;
    
                // Update the user in the database
                database.updateById(userId, user, (err, updatedUser) => {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, {
                            message: `User with ID ${userId} updated successfully.`,
                            data: updatedUser
                        });
                    }
                });
            }
        });
    }


}



module.exports = userService
