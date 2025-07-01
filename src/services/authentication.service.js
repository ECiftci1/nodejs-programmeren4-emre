const jwt = require('jsonwebtoken')
const db = require('../dao/mysql-db')
const logger = require('../util/logger')
const jwtSecretKey = require('../util/config').secretkey

const authService = {
    login: (userCredentials, callback) => {
        logger.debug('login')

        db.getConnection((err, connection) => {
            if (err) {
                logger.error(err)
                callback({
                    status: 500,
                    message: 'Database connection error'
                }, null);
                return;
            }
            if (connection) {
                connection.query(
                    'SELECT `id`, `emailAdress`, `password`, `firstName`, `lastName` FROM `user` WHERE `emailAdress` = ?',
                    [userCredentials.emailAdress],
                    (err, rows) => {
                        connection.release()
                        if (err) {
                            logger.error('Error:', err.toString())
                            callback({
                                status: 500,
                                message: 'Database query error'
                            }, null);
                            return;
                        }
                        if (!rows || rows.length !== 1) {
                            logger.trace('User not found');
                            callback({
                                status: 409,
                                message: 'User not found or password invalid',
                                data: {}
                            }, null);
                            return;
                        }
                        if (rows[0].password === userCredentials.password) {
                            logger.trace('Passwords matched, sending token');
                            const { password, ...userinfo } = rows[0];
                            const payload = { userId: userinfo.id };
                            jwt.sign(payload, jwtSecretKey, { expiresIn: '12d' }, (err, token) => {
                                if (err) {
                                    logger.error('JWT sign error:', err);
                                    callback({
                                        status: 500,
                                        message: 'Token generation failed'
                                    }, null);
                                    return;
                                }
                                callback(null, {
                                    status: 200,
                                    message: 'User logged in',
                                    data: { ...userinfo, token }
                                });
                            });
                        } else {
                            logger.trace('Password invalid');
                            callback({
                                status: 409,
                                message: 'User not found or password invalid',
                                data: {}
                            }, null);
                        }
                    }
                )
            }
        })
    }
}

module.exports = authService
