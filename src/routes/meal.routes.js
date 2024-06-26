const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const validateToken = require('./authentication.routes').validateToken;

// Meal routes
router.post('/api/meal', validateToken, mealController.create);
router.get('/api/meal', mealController.getAll);
router.get('/api/meal/:mealId', mealController.getById);
router.put('/api/meal/:mealId', validateToken, mealController.update);
router.delete('/api/meal/:mealId', validateToken, mealController.delete);

module.exports = router;
