const mealService = require('../services/meal.service');
const logger = require('../util/logger');

let mealController = {
    create: (req, res, next) => {
        const meal = {
            ...req.body,
            cookId: req.userId
        };
        logger.info('create meal', meal);
        mealService.create(meal, (error, success) => {
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

    getAll: (req, res, next) => {
        logger.trace('getAll meals');
        mealService.getAll((error, success) => {
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

    getById: (req, res, next) => {
        const mealId = req.params.mealId;
        logger.trace('mealController: getById', mealId);
        mealService.getById(mealId, (error, success) => {
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

    update: (req, res, next) => {
        const mealId = parseInt(req.params.mealId);
        const meal = req.body;
        const userIdFromToken = req.userId;

        logger.trace('mealController: update', mealId);

        mealService.getById(mealId, (error, success) => {
            if (error || !success || !success.data) {
                return res.status(404).json({
                    status: 404,
                    message: 'Meal not found',
                    data: {}
                });
            }

            const mealData = success.data;
            if (parseInt(mealData.cookId) !== parseInt(userIdFromToken)) {
                return res.status(403).json({
                    status: 403,
                    message: 'You can only update your own meals!',
                    data: {}
                });
            }

            mealService.update(mealId, meal, (error, success) => {
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
        });
    },

    delete: (req, res, next) => {
        const mealId = parseInt(req.params.mealId);
        const userIdFromToken = req.userId;

        logger.trace('mealController: delete', mealId);

        mealService.getById(mealId, (error, success) => {
            if (error || !success || !success.data) {
                return res.status(404).json({
                    status: 404,
                    message: 'Meal not found',
                    data: {}
                });
            }

            const mealData = success.data;
            if (parseInt(mealData.cookId) !== parseInt(userIdFromToken)) {
                return res.status(403).json({
                    status: 403,
                    message: 'You can only delete your own meals!',
                    data: {}
                });
            }

            mealService.delete(mealId, (error, success) => {
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
        });
    }
};

module.exports = mealController;
