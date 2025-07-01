process.env.DB_DATABASE = process.env.DB_DATABASE_TEST || 'share-a-meal-test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const db = require('../src/dao/mysql-db');
chai.should();
chai.use(chaiHttp);

const CLEAR_USERS = 'DELETE FROM `user`;';
const INSERT_USER =
    'INSERT INTO `user` (`id`, `isActive`, `emailAdress`, `password`, `firstName`, `lastName`, `phoneNumber`, `roles`, `street`, `city`) VALUES (1, 1, "test@server.nl", "secret", "Test", "User", "0612345678", "editor", "street", "city");';

describe('UC101 Inloggen', () => {
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            if (err) return done(err);
            conn.query(CLEAR_USERS + INSERT_USER, () => {
                conn.release();
                done();
            });
        });
    });

    it('TC-101-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send({ emailAdress: "" }) // password ontbreekt
            .end((err, res) => {
                chai.expect(res).to.have.status(409); 
                done();
            });
    });

    it('TC-101-2 Niet-valide wachtwoord', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send({ emailAdress: "test@server.nl", password: "foutwachtwoord" })
            .end((err, res) => {
                chai.expect(res).to.have.status(409);
                done();
            });
    });

    it('TC-101-3 Gebruiker bestaat niet', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send({ emailAdress: "nietbestaat@server.nl", password: "secret" })
            .end((err, res) => {
                chai.expect(res).to.have.status(409);
                done();
            });
    });

    it('TC-101-4 Gebruiker succesvol ingelogd', (done) => {
        chai.request(server)
            .post('/api/auth/login')
            .send({ emailAdress: "test@server.nl", password: "secret" })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.have.property('token');
                done();
            });
    });
});
