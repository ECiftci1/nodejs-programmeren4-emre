const mealService = require('../services/meal.service');
const logger = require('../util/logger');

let mealController = {
    create: (req, res, next) => {
        const meal = req.body;
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
        const mealId = req.params.mealId;
        const meal = req.body;
        logger.trace('mealController: update', mealId);
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
    },

    delete: (req, res, next) => {
        const mealId = req.params.mealId;
        logger.trace('mealController: delete', mealId);
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
    }
};

module.exports = mealController;
