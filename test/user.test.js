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
const INSERT_USER2 =
    'INSERT INTO `user` (`id`, `isActive`, `emailAdress`, `password`, `firstName`, `lastName`, `phoneNumber`, `roles`, `street`, `city`) VALUES (2, 0, "inactive@server.nl", "secret", "Inactief", "User", "0612349999", "editor", "street", "city");';

describe('UC201 Registreren', () => {
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            if (err) return done(err);
            conn.query(CLEAR_USERS, () => { conn.release(); done(); });
        });
    });

    it('TC-201-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post('/api/user')
            .send({
                // "firstName": "Test",
                "lastName": "User",
                "emailAdress": "new@server.nl",
                "password": "Password1",
                "street": "Teststraat",
                "city": "Testcity",
                "isActive": 1,
                "phoneNumber": "0612345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(400);
                done();
            });
    });

    it('TC-201-2 Niet-valide emailadres', (done) => {
        chai.request(server)
            .post('/api/user')
            .send({
                "firstName": "Test",
                "lastName": "User",
                "emailAdress": "foutemail",
                "password": "Password1",
                "street": "Teststraat",
                "city": "Testcity",
                "isActive": 1,
                "phoneNumber": "0612345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(400);
                done();
            });
    });

    it('TC-201-3 Niet-valide wachtwoord', (done) => {
        chai.request(server)
            .post('/api/user')
            .send({
                "firstName": "Test",
                "lastName": "User",
                "emailAdress": "good@server.nl",
                "password": "abc",
                "street": "Teststraat",
                "city": "Testcity",
                "isActive": 1,
                "phoneNumber": "0612345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(400);
                done();
            });
    });

    it('TC-201-4 Gebruiker bestaat al', (done) => {
        db.getConnection((err, conn) => {
            conn.query(INSERT_USER, () => {
                conn.release();
                chai.request(server)
                    .post('/api/user')
                    .send({
                        "firstName": "Test",
                        "lastName": "User",
                        "emailAdress": "test@server.nl",
                        "password": "Password1",
                        "street": "Teststraat",
                        "city": "Testcity",
                        "isActive": 1,
                        "phoneNumber": "0612345678",
                        "roles": "editor"
                    })
                    .end((err, res) => {
                        chai.expect(res).to.have.status(500);
                        done();
                    });
            });
        });
    });

    it('TC-201-5 Gebruiker succesvol geregistreerd', (done) => {
        chai.request(server)
            .post('/api/user')
            .send({
                "firstName": "Nieuw",
                "lastName": "User",
                "emailAdress": "nieuw@server.nl",
                "password": "Password1",
                "street": "Teststraat",
                "city": "Testcity",
                "isActive": 1,
                "phoneNumber": "0612345678",
                "roles": "editor"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                done();
            });
    });
});

describe('UC202 Overzicht users', () => {
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            if (err) return done(err);
            conn.query(CLEAR_USERS + INSERT_USER + INSERT_USER2, () => {
                conn.release();
                done();
            });
        });
    });

    it('TC-202-1 Toon alle gebruikers', (done) => {
        chai.request(server)
            .get('/api/user')
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.be.an('array');
                done();
            });
    });

    it('TC-202-2 Toon gebruikers met zoekterm isActive false', (done) => {
        chai.request(server)
            .get('/api/user?isActive=0')
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data.some(u => u.isActive === 0)).to.be.true;
                done();
            });
    });

    it('TC-202-3 Toon gebruikers met zoekterm isActive true', (done) => {
        chai.request(server)
            .get('/api/user?isActive=1')
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data.some(u => u.isActive === 1)).to.be.true;
                done();
            });
    });

    it('TC-202-4 Toon gebruikers met zoektermen op bestaande velden', (done) => {
        chai.request(server)
            .get('/api/user?firstName=Test&lastName=User')
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.be.an('array');
                done();
            });
    });
});

describe('UC203 Gebruikersprofiel', () => {
    let token;
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            conn.query(CLEAR_USERS + INSERT_USER, () => {
                conn.release();
                chai.request(server)
                    .post('/api/auth/login')
                    .send({ emailAdress: "test@server.nl", password: "secret" })
                    .end((err, res) => {
                        token = res.body.data.token;
                        done();
                    });
            });
        });
    });

    it('TC-203-1 Ongeldig token', (done) => {
        chai.request(server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer onzin`)
            .end((err, res) => {
                chai.expect(res).to.have.status(401);
                done();
            });
    });

    it('TC-203-2 Profiel ophalen met token', (done) => {
        chai.request(server)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.have.property('emailAdress').equals('test@server.nl');
                done();
            });
    });
});

describe('UC204 Usergegevens bij ID', () => {
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            conn.query(CLEAR_USERS + INSERT_USER, () => {
                conn.release();
                done();
            });
        });
    });

    it('TC-204-1 Gebruiker-ID bestaat niet', (done) => {
        chai.request(server)
            .get('/api/user/999')
            .end((err, res) => {
                chai.expect(res).to.have.status(404);
                done();
            });
    });

    it('TC-204-2 Gebruiker-ID bestaat', (done) => {
        chai.request(server)
            .get('/api/user/1')
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.have.property('id').equals(1);
                done();
            });
    });
});

describe('UC205 User updaten', () => {
    let token;
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            conn.query(CLEAR_USERS + INSERT_USER, () => {
                conn.release();
                chai.request(server)
                    .post('/api/auth/login')
                    .send({ emailAdress: "test@server.nl", password: "secret" })
                    .end((err, res) => {
                        token = res.body.data.token;
                        done();
                    });
            });
        });
    });

    it('TC-205-1 Niet de eigenaar', (done) => {
        // user met id 2 aanmaken
        db.getConnection((err, conn) => {
            conn.query(INSERT_USER2, () => {
                conn.release();
                chai.request(server)
                    .put('/api/user/2')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        emailAdress: "inactive@server.nl",
                        firstName: "NOPE"
                    })
                    .end((err, res) => {
                        chai.expect(res).to.have.status(403);
                        done();
                    });
            });
        });
    });

    it('TC-205-3 Gebruiker bestaat niet', (done) => {
        chai.request(server)
            .put('/api/user/999')
            .set('Authorization', `Bearer ${token}`)
            .send({
                emailAdress: "nonexistent@server.nl",
                firstName: "Test"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(403);
                done();
            });
    });

    it('TC-205-4 Niet ingelogd', (done) => {
        chai.request(server)
            .put('/api/user/1')
            .send({ emailAdress: "test@server.nl", firstName: "Test" })
            .end((err, res) => {
                chai.expect(res).to.have.status(401);
                done();
            });
    });

    it('TC-205-5 Gebruiker succesvol gewijzigd', (done) => {
        chai.request(server)
            .put('/api/user/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ emailAdress: "test@server.nl", firstName: "Changed" })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                done();
            });
    });
});

describe('UC206 User verwijderen', () => {
    let token;
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            conn.query(CLEAR_USERS + INSERT_USER, () => {
                conn.release();
                chai.request(server)
                    .post('/api/auth/login')
                    .send({ emailAdress: "test@server.nl", password: "secret" })
                    .end((err, res) => {
                        token = res.body.data.token;
                        done();
                    });
            });
        });
    });

    it('TC-206-1 User bestaat niet', (done) => {
        chai.request(server)
            .delete('/api/user/999')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(403);
                done();
            });
    });

    it('TC-206-2 Niet ingelogd', (done) => {
        chai.request(server)
            .delete('/api/user/1')
            .end((err, res) => {
                chai.expect(res).to.have.status(401);
                done();
            });
    });

    it('TC-206-3 Niet eigenaar', (done) => {
        db.getConnection((err, conn) => {
            conn.query(INSERT_USER2, () => {
                conn.release();
                chai.request(server)
                    .delete('/api/user/2')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err, res) => {
                        chai.expect(res).to.have.status(403);
                        done();
                    });
            });
        });
    });

    it('TC-206-4 User succesvol verwijderd', (done) => {
        chai.request(server)
            .delete('/api/user/1')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                done();
            });
    });
});
