process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal';
process.env.LOGLEVEL = 'trace';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const jwtSecretKey = require('../src/util/config').secretkey;
const db = require('../src/dao/mysql-db');
const server = require('../index');
const logger = require('../src/util/logger');
require('dotenv').config();

chai.should();
chai.use(chaiHttp);

/**
 * Db queries to clear and fill the test database before each test.
 */
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;';
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
const INSERT_USER =
    'INSERT INTO `user` (`id`, `isActive`, `emailAdress`, `password`, `firstName`, `lastName`, `phoneNumber`, `roles`, `street`, `city` ) VALUES' +
    '(1, 1, "name@server.nl", "secret", "first", "last", "0612345678", "editor", "street", "city");';

/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";

const endpointToTest = '/api/user'; // Define the endpoint to test

before((done) => {
    logger.debug(
        'before: hier zorg je eventueel dat de precondities correct zijn'
    );
    logger.debug('before done');
    done();
});

// Testcases for the user.create endpoint UC201
describe('UC201 Register as a new user', () => {
    beforeEach((done) => {
        logger.debug('beforeEach called');
        // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
        db.getConnection(function (err, connection) {
            if (err) throw err; // not connected!

            // Use the connection
            connection.query(
                CLEAR_DB + INSERT_USER,
                function (error, results, fields) {
                    // When done with the connection, release it.
                    connection.release();

                    // Handle error after the release.
                    if (error) throw error;
                    // Let op dat je done() pas aanroept als de query callback eindigt!
                    logger.debug('beforeEach done');
                    done();
                }
            );
        });
    });

    /**
     * The testcases start here
     */
    it('TC-201-1 Required field is missing', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                // "firstName": "firstName", Required field is missing
                "lastName": "lastName",
                "isActive": "1",
                "street": "street 1",
                "city": "city",
                "emailAdress": "v.az@server.nl",
                "password": "Password1",
                "phoneNumber": "06-12345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(400);
                chai.expect(res).not.to.have.status(200);
                chai.expect(res.body).to.be.a('object');
                chai.expect(res.body).to.have.property('status').equals(400);
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals('Missing or incorrect firstName field');
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty;

                done();
            });
    });

    it('TC-201-2 Invalid email address', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                "firstName": "firstName",
                "lastName": "lastName",
                "isActive": "1",
                "street": "street 1",
                "city": "city",
                "emailAdress": "server.nl", // Invalid email address
                "password": "Password1",
                "phoneNumber": "06-12345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(400);
                chai.expect(res).not.to.have.status(200);
                chai.expect(res.body).to.be.a('object');
                chai.expect(res.body).to.have.property('status').equals(400);
                chai.expect(res.body)
                    .to.have.property('message')
                    .that.includes('Invalid email address');
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty;

                done();
            });
    });

    it('TC-201-3 Invalid password', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                "firstName": "firstName",
                "lastName": "lastName",
                "isActive": "1",
                "street": "street 1",
                "city": "city",
                "emailAdress": "v.az@server.nl",
                "password": "test", // Invalid password
                "phoneNumber": "06-12345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(400);
                chai.expect(res).not.to.have.status(200);
                chai.expect(res.body).to.be.a('object');
                chai.expect(res.body).to.have.property('status').equals(400);
                chai.expect(res.body)
                    .to.have.property('message')
                    .that.includes('Password must be at least 8 characters long and include numbers');
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty;

                done();
            });
    });

    // This test is skipped because there is no way to check if the user already exists at the moment.
    it.skip('TC-201-4 User already exists', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                "firstName": "Hendrik",
                "lastName": "van Dam",
                "isActive": "1",
                "street": "Kerkstraat 1",
                "city": "Amsterdam",
                "emailAdress": "m.Jansen@server.nl",
                "password": "Password1",
                "phoneNumber": "06-12345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(403);
                chai.expect(res).not.to.have.status(400);
                chai.expect(res.body).to.be.a('object');
                chai.expect(res.body).to.have.property('status').equals(403);
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals('User already exists');
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty;

                done();
            });
    });

    it('TC-201-5 User successfully registered', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                "firstName": "firstName",
                "lastName": "lastName",
                "isActive": "1",
                "street": "street 1",
                "city": "city",
                "emailAdress": "v.az@server.nl",
                "password": "Password1",
                "phoneNumber": "06-12345678",
                "roles": "editor"
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');

                res.body.should.have.property('data').that.is.a('object');
                res.body.should.have.property('message').that.is.a('string');

                done();
            });
    });
});
