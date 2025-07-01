const database = require('../dao/mysql-db')
const logger = require('../util/logger')

const userService = {
    create: (user, callback) => {
        logger.info('create user', user);

        const query = `
            INSERT INTO user (firstName, lastName, isActive, emailAdress, password, phoneNumber, roles, street, city)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            user.firstName,
            user.lastName,
            user.isActive,
            user.emailAdress,
            user.password,
            user.phoneNumber,
            user.roles,
            user.street,
            user.city
        ];

        database.query(query, values, (err, results) => {
            if (err) {
                logger.error('Error creating user:', err);
                callback({
                    status: 500,
                    message: 'Failed to create user'
                }, null);
                return;
            }
            const userId = results.insertId;
            logger.trace(`User created with id ${userId}.`);
            callback(null, {
                status: 200,
                message: `User created with id ${userId}.`,
                data: { userId }
            });
        });
    },

    getAll: (filters, callback) => {
        let query = 'SELECT * FROM user';
        const params = [];

        if (filters && Object.keys(filters).length > 0) {
            query += ' WHERE ';
            const conditions = [];
            for (const key in filters) {
                conditions.push(`${key} = ?`);
                params.push(filters[key]);
            }
            query += conditions.join(' AND ');
        }

        database.query(query, params, (error, results) => {
            if (error) {
                logger.error('Error fetching users with filters:', error);
                callback({
                    status: 500,
                    message: 'Failed to fetch users with filters'
                }, null);
                return;
            }
            logger.info(`Found ${results.length} users with filters:`, filters);
            callback(null, {
                status: 200,
                message: `Found ${results.length} users with filters`,
                data: results
            });
        });
    },

    getProfile: (userId, callback) => {
        logger.info('getProfile userId:', userId)

        database.query(
            'SELECT id, firstName, lastName FROM user WHERE id = ?',
            [userId],
            (error, results) => {
                if (error) {
                    logger.error('Error fetching profile:', error);
                    callback({
                        status: 500,
                        message: 'Failed to fetch user profile'
                    }, null);
                    return;
                }
                if (results.length === 0) {
                    callback({
                        status: 404,
                        message: 'User not found'
                    }, null);
                    return;
                }
                callback(null, {
                    status: 200,
                    message: `Found user profile.`,
                    data: results[0]
                });
            }
        );
    },

    getById: (userId, callback) => {
        const query = 'SELECT * FROM user WHERE id = ?';
        database.query(query, [userId], (error, results) => {
            if (error) {
                logger.error('Error fetching user:', error);
                callback({
                    status: 500,
                    message: 'Failed to fetch user'
                }, null);
                return;
            }
            if (results.length === 0) {
                callback({
                    status: 404,
                    message: 'User not found'
                }, null);
                return;
            }
            callback(null, {
                status: 200,
                message: 'User fetched successfully',
                data: results[0]
            });
        });
    },

    delete: (userId, callback) => {
        const query = 'DELETE FROM user WHERE id = ?';
        database.query(query, [userId], (error, results) => {
            if (error) {
                logger.error('Error deleting user:', error);
                callback({
                    status: 500,
                    message: 'Failed to delete user'
                }, null);
                return;
            }
            if (results.affectedRows === 0) {
                callback({
                    status: 404,
                    message: 'User not found for deletion'
                }, null);
                return;
            }
            logger.info('User deleted successfully');
            callback(null, {
                status: 200,
                message: 'User deleted successfully'
            });
        });
    },

    update: (userId, user, callback) => {
        logger.info('update user', userId);

        const keysToUpdate = Object.keys(user).filter(key => user[key] !== undefined && key !== 'id');

        if (keysToUpdate.length === 0) {
            callback({
                status: 400,
                message: 'No valid fields to update'
            }, null);
            return;
        }

        const values = keysToUpdate.map(key => user[key]);
        values.push(userId);

        const query = `UPDATE user SET ${keysToUpdate.map(key => `${key} = ?`).join(', ')} WHERE id = ?`;

        database.query(query, values, (err, results) => {
            if (err) {
                logger.error('Error updating user:', err);
                callback({
                    status: 500,
                    message: 'Failed to update user'
                }, null);
                return;
            }
            if (results.affectedRows === 0) {
                callback({
                    status: 404,
                    message: 'User not found'
                }, null);
                return;
            }
            logger.trace(`User updated with id ${userId}.`);
            callback(null, {
                status: 200,
                message: `User updated with id ${userId}.`,
                data: { userId }
            });
        });
    }
}

module.exports = userService;
