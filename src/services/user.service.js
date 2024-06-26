const database = require('../dao/mysql-db')
const logger = require('../util/logger')

const db = require('../dao/mysql-db')

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
                callback(err, null);
            } else {
                const userId = results.insertId;
                logger.trace(`User created with id ${userId}.`);
                callback(null, {
                    message: `User created with id ${userId}.`,
                    data: {
                        userId: userId
                    }
                });
            }
        });
    },

    // getAll: (callback) => {
    //     logger.info('getAll')

    //     // Deprecated: de 'oude' manier van werken, met de inmemory database
    //     // database.getAll((err, data) => {
    //     //     if (err) {
    //     //         callback(err, null)
    //     //     } else {
    //     //         callback(null, {
    //     //             message: `Found ${data.length} users.`,
    //     //             data: data
    //     //         })
    //     //     }
    //     // })

    //     // Nieuwe manier van werken: met de MySQL database
    //     db.getConnection(function (err, connection) {
    //         if (err) {
    //             logger.error(err)
    //             callback(err, null)
    //             return
    //         }

    //         connection.query(
    //             'SELECT id, firstName, lastName FROM `user`',
    //             function (error, results, fields) {
    //                 connection.release()

    //                 if (error) {
    //                     logger.error(error)
    //                     callback(error, null)
    //                 } else {
    //                     logger.debug(results)
    //                     callback(null, {
    //                         message: `Found ${results.length} users.`,
    //                         data: results
    //                     })
    //                 }
    //             }
    //         )
    //     })
    // },

    getAll: (filters, callback) => {
        let query = 'SELECT * FROM user';
        const params = [];

        // Constructing the SQL query dynamically based on filters
        if (Object.keys(filters).length > 0) {
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
            } else {
                logger.info(`Found ${results.length} users with filters:`, filters);
                callback(null, {
                    status: 200,
                    message: `Found ${results.length} users with filters`,
                    data: results
                });
            }
        });
    },

    getProfile: (userId, callback) => {
        logger.info('getProfile userId:', userId)

        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }

            connection.query(
                'SELECT id, firstName, lastName FROM `user` WHERE id = ?',
                [userId],
                function (error, results, fields) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else {
                        logger.debug(results)
                        callback(null, {
                            message: `Found ${results.length} user.`,
                            data: results
                        })
                    }
                }
            )
        })
    },

    getById: (userId, callback) => {
        const query = 'SELECT * FROM user WHERE id = ?';
        database.query(query, [userId], (error, results) => {
            if (error) {
                logger.error('Error fetching user:', error);
                return callback({
                    status: 500,
                    message: 'Failed to fetch user'
                });
            }
            if (results.length === 0) {
                return callback({
                    status: 404,
                    message: 'User not found'
                });
            }
            logger.info('User fetched:', results[0]);
            callback(null, {
                status: 200,
                message: 'User fetched successfully',
                data: results[0]
            });
        });
    },

    authenticate: async (username, password) => {
        try {
            const query = 'SELECT * FROM users WHERE username = ?';
            const user = await database.query(query, [username]);

            if (!user) {
                return {
                    status: 401,
                    message: 'Authentication failed! User not found.',
                    data: {}
                };
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return {
                    status: 401,
                    message: 'Authentication failed! Wrong password.',
                    data: {}
                };
            }

            const token = jwt.sign({ id: user.id, username: user.username }, 'your-secret-key', { expiresIn: '1h' });

            return {
                status: 200,
                message: 'Authentication successful!',
                data: { token }
            };
        } catch (error) {
            return {
                status: 500,
                message: 'Internal Server Error',
                data: {}
            };
        }
    },

    delete: (userId, callback) => {
    const query = 'DELETE FROM user WHERE id = ?';
    database.query(query, [userId], (error, results) => {
        if (error) {
            logger.error('Error deleting user:', error);
            return callback({
                status: 500,
                message: 'Failed to delete user'
            });
        }
        if (results.affectedRows === 0) {
            return callback({
                status: 404,
                message: 'User not found for deletion'
            });
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

        // Extract keys from the user object excluding undefined values
        const keysToUpdate = Object.keys(user).filter(key => user[key] !== undefined && key !== 'id');

        if (keysToUpdate.length === 0) {
            return callback({
                status: 400,
                message: 'No valid fields to update'
            }, null);
        }

        const values = keysToUpdate.map(key => user[key]);
        values.push(userId); // Add userId as the last value for WHERE clause

        // Constructing the dynamic SQL query
        let query = `UPDATE user SET ${keysToUpdate.map(key => `${key} = ?`).join(', ')} WHERE id = ?`;

        database.query(query, values, (err, results) => {
            if (err) {
                logger.error('Error updating user:', err);
                callback(err, null);
            } else {
                logger.trace(`User updated with id ${userId}.`);
                callback(null, {
                    message: `User updated with id ${userId}.`,
                    data: {
                        userId: userId
                    }
                });
            }
        });
    },

}

module.exports = userService
