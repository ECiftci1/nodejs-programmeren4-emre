const userService = require('../services/user.service');
const logger = require('../util/logger');

let userController = {
    create: (req, res, next) => {
        const user = req.body;
        logger.info('create user', user.firstName, user.lastName);
        userService.create(user, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    // getAll: (req, res, next) => {
    //     logger.trace('getAll');
    //     userService.getAll((error, success) => {
    //         if (error) {
    //             return next({
    //                 status: error.status,
    //                 message: error.message,
    //                 data: {}
    //             });
    //         }
    //         if (success) {
    //             res.status(200).json({
    //                 status: 200,
    //                 message: success.message,
    //                 data: success.data
    //             });
    //         }
    //     });
    // },

    getAll: (req, res, next) => {
        const filters = req.query; // Extract query parameters as filters
        logger.info('Fetching users with filters:', filters);
        userService.getAll(filters, (error, success) => {
            if (error) {
                return next({
                    status: error.status || 500,
                    message: error.message || 'Error fetching users with filters',
                    data: {}
                });
            }
            res.status(200).json({
                status: 200,
                message: 'Users fetched successfully',
                data: success.data
            });
        });
    },

    getById: (req, res, next) => {
        const userId = req.params.userId;
        logger.trace('userController: getById', userId);
        userService.getById(userId, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    getProfile: (req, res, next) => {
        const userId = req.userId;
        logger.trace('getProfile for userId', userId);
        userService.getById(userId, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: 200,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    update: (req, res, next) => {
        const userId = req.params.userId;
        const user = req.body;
        logger.trace('userController: update', userId);
        userService.update(userId, user, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    },

    delete: (req, res, next) => {
        const userId = req.params.userId;
        logger.trace('userController: delete', userId);
        userService.delete(userId, (error, success) => {
            if (error) {
                return next({
                    status: error.status,
                    message: error.message,
                    data: {}
                });
            }
            if (success) {
                res.status(200).json({
                    status: success.status,
                    message: success.message,
                    data: success.data
                });
            }
        });
    }
};

module.exports = userController;
