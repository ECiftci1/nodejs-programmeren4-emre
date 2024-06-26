const express = require('express');
const assert = require('assert');
const chai = require('chai');
chai.should();
const router = express.Router();
const userController = require('../controllers/user.controller');
const validateToken = require('./authentication.routes').validateToken;
const logger = require('../util/logger');

// Validation for user creation
const validateUserCreate = (req, res, next) => {
    try {
        assert(req.body.firstName, 'Missing or incorrect firstName field');
        chai.expect(req.body.firstName).to.not.be.empty;
        chai.expect(req.body.firstName).to.be.a('string');
        chai.expect(req.body.firstName).to.match(/^[a-zA-Z]+$/, 'firstName must be a string');
        logger.trace('User successfully validated');
        next();
    } catch (ex) {
        logger.trace('User validation failed:', ex.message);
        next({
            status: 400,
            message: ex.message,
            data: {}
        });
    }
};

// User routes
router.post('/api/user', validateUserCreate, userController.create);
router.get('/api/user', userController.getAll);
router.get('/api/user/profile', validateToken, userController.getProfile);
router.get('/api/user/:userId', userController.getById);
router.put('/api/user/:userId', validateToken, userController.update);
router.delete('/api/user/:userId', validateToken, userController.delete);

module.exports = router;
