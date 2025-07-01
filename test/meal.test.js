process.env.DB_DATABASE = process.env.DB_DATABASE_TEST || 'share-a-meal-test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const db = require('../src/dao/mysql-db');
chai.should();
chai.use(chaiHttp);

const CLEAR = 'DELETE FROM `meal`; DELETE FROM `user`;';
const INSERT_USER = `INSERT INTO user (id, isActive, emailAdress, password, firstName, lastName, phoneNumber, roles, street, city)
VALUES (1, 1, "test@server.nl", "secret", "Test", "User", "0612345678", "editor", "street", "city");`;

describe('UC301 Toevoegen van maaltijd', () => {
    let token;
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            conn.query(CLEAR + INSERT_USER, () => {
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

    it('TC-301-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post('/api/meal')
            .set('Authorization', `Bearer ${token}`)
            .send({
                // name ontbreekt
                description: "desc",
                dateTime: "2025-07-01T18:30:00",
                maxAmountOfParticipants: 5,
                price: 7.50,
                imageUrl: "img"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(500);
                done();
            });
    });

    it('TC-301-2 Niet ingelogd', (done) => {
        chai.request(server)
            .post('/api/meal')
            .send({
                name: "Meal",
                description: "desc",
                dateTime: "2025-07-01T18:30:00",
                maxAmountOfParticipants: 5,
                price: 7.50,
                imageUrl: "img"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(401);
                done();
            });
    });

    it('TC-301-3 Maaltijd succesvol toegevoegd', (done) => {
        chai.request(server)
            .post('/api/meal')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: "Speciale Pasta",
                description: "Lekkere Italianse eten",
                imageUrl: "http://example.com/pasta.jpg",
                dateTime: "2025-07-01T18:30:00",
                isActive: 1,
                isVega: 0,
                isVegan: 0,
                isToTakeHome: 0,
                maxAmountOfParticipants: 5,
                price: 10.00,
                allergenes: "gluten,lactose"
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                done();
            });
    });
});

describe('UC302 Wijzigen van maaltijdsgegevens', () => {
    let token;
    let mealId;

    beforeEach((done) => {
        db.getConnection((err, conn) => {
            if (err) return done(err);

            // Clear & insert user + meal
            const setupQuery = `
                DELETE FROM meal;
                DELETE FROM user;
                INSERT INTO user (id, isActive, emailAdress, password, firstName, lastName, phoneNumber, roles, street, city)
                VALUES (1, 1, "test@server.nl", "secret", "Test", "User", "0612345678", "editor", "street", "city");
                INSERT INTO meal (isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes)
                VALUES (1, 0, 0, 0, 5, 7.50, "img", 1, "Meal", "desc", "");
            `;

            conn.query(setupQuery, (err) => {
                if (err) {
                    conn.release();
                    return done(err);
                }

                // Get the inserted meal's ID
                conn.query('SELECT id FROM meal WHERE cookId = 1 LIMIT 1', (err, results) => {
                    conn.release();
                    if (err) return done(err);

                    mealId = results[0].id;

                    // Login user to get token
                    chai.request(server)
                        .post('/api/auth/login')
                        .send({ emailAdress: "test@server.nl", password: "secret" })
                        .end((err, res) => {
                            if (err) return done(err);
                            token = res.body.data.token;
                            done();
                            });
                    });
            });
        });
    });

    it('TC-302-2 Niet ingelogd', (done) => {
        chai.request(server)
            .put(`/api/meal/${mealId}`)
            .send({
                name: "Changed",
                price: 8.50,
                maxAmountOfParticipants: 5
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(401);
                done();
            });
    });

    it('TC-302-3 Niet eigenaar', (done) => {
        // Insert user 2, login, then try update meal owned by user 1
        db.getConnection((err, conn) => {
            if (err) return done(err);
            conn.query(`
            INSERT IGNORE INTO user (id, isActive, emailAdress, password, firstName, lastName, phoneNumber, roles, street, city)
            VALUES (2, 1, 'other@server.nl', 'secret123', 'Other', 'User', '0612349999', 'editor', 'street', 'city');
            `, (err) => {
            conn.release();
            if (err) return done(err);

            chai.request(server)
                .post('/api/auth/login')
                .send({ emailAdress: 'other@server.nl', password: 'secret123' })
                .end((err, res) => {
                if (err) return done(err);
                const token2 = res.body.data.token;
                chai.request(server)
                    .put(`/api/meal/${mealId}`)
                    .set('Authorization', `Bearer ${token2}`)
                    .send({
                    name: 'Changed',
                    price: 8.50,
                    maxAmountOfParticipants: 5
                    })
                    .end((err, res) => {
                        mealId = res.body.data.mealId;
                        chai.expect(res).to.have.status(403);
                    done();
                    });
                });
            });
        });
    });

    it('TC-302-4 Maaltijd bestaat niet', (done) => {
        chai.request(server)
            .put(`/api/meal/9999`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: "Changed",
                price: 8.50,
                maxAmountOfParticipants: 5
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(404);
                done();
            });
    });

    it('TC-302-5 Maaltijd succesvol gewijzigd', (done) => {
        chai.request(server)
            .put(`/api/meal/${mealId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: "Changed",
                price: 8.50,
                maxAmountOfParticipants: 5
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                done();
            });
    });
});

describe('UC303 Opvragen alle maaltijden', () => {
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            conn.query(CLEAR + INSERT_USER, () => {
                conn.release();
                done();
            });
        });
    });

    it('TC-303-1 Lijst maaltijden geretourneerd', (done) => {
        chai.request(server)
            .get('/api/meal')
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.be.an('array');
                done();
            });
    });
});

describe('UC304 Opvragen maaltijd bij ID', () => {
    let token;
    let mealId;
    beforeEach((done) => {
        db.getConnection((err, conn) => {
    if (err) return done(err);

    conn.query(CLEAR + INSERT_USER, (error) => {
        if (error) {
            conn.release();
            return done(error);
        }

        // Login user first to get token
        chai.request(server)
            .post('/api/auth/login')
            .send({ emailAdress: "test@server.nl", password: "secret" })
            .end((err, res) => {
                if (err) {
                    conn.release();
                    return done(err);
                }
                token = res.body.data.token;

                // Directly insert meal with cookId = 1 (your test user)
                const INSERT_MEAL = `
                    INSERT INTO meal
                    (isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes, dateTime)
                    VALUES
                    (1, 0, 0, 0, 5, 7.50, 'img', 1, 'Meal', 'desc', '', '2025-07-01T18:30:00');
                `;

                conn.query(INSERT_MEAL, (err2, results) => {
                    conn.release();
                    if (err2) return done(err2);

                    mealId = results.insertId;  // Save mealId for your tests
                    done();
                });
            });
    });
});

    });

    it('TC-304-1 Maaltijd bestaat niet', (done) => {
        chai.request(server)
            .get(`/api/meal/9999`)
            .end((err, res) => {
                chai.expect(res).to.have.status(404);
                done();
            });
    });

    it('TC-304-2 Details maaltijd geretourneerd', (done) => {
        chai.request(server)
            .get(`/api/meal/${mealId}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body.data).to.have.property('id').equals(mealId);
                done();
            });
    });
});

describe('UC305 Verwijderen maaltijd', () => {
    let token;
    let mealId;
    beforeEach((done) => {
        db.getConnection((err, conn) => {
            if (err) return done(err);

            conn.query(CLEAR + INSERT_USER, (error) => {
                if (error) {
                    conn.release();
                    return done(error);
                }

                chai.request(server)
                    .post('/api/auth/login')
                    .send({ emailAdress: "test@server.nl", password: "secret" })
                    .end((err, res) => {
                        if (err) {
                            conn.release();
                            return done(err);
                        }
                        token = res.body.data.token;

                        const INSERT_MEAL = `
                            INSERT INTO meal
                            (isActive, isVega, isVegan, isToTakeHome, maxAmountOfParticipants, price, imageUrl, cookId, name, description, allergenes, dateTime)
                            VALUES
                            (1, 0, 0, 0, 5, 7.50, 'img', 1, 'Meal', 'desc', '', '2025-07-01T18:30:00');
                        `;

                        conn.query(INSERT_MEAL, (err2, results) => {
                            conn.release();
                            if (err2) return done(err2);

                            mealId = results.insertId;  // store inserted meal ID
                            done();
                        });
                    });
            });
        });
    });

    it('TC-305-1 Niet ingelogd', (done) => {
        chai.request(server)
            .delete(`/api/meal/${mealId}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(401);
                done();
            });
    });

    it('TC-305-2 Niet eigenaar', (done) => {
        db.getConnection((err, conn) => {
            conn.query(`INSERT INTO user (id, isActive, emailAdress, password, firstName, lastName, phoneNumber, roles, street, city)
                VALUES (2, 1, "other@server.nl", "secret", "Other", "User", "0612349999", "editor", "street", "city");`, () => {
                conn.release();
                chai.request(server)
                    .post('/api/auth/login')
                    .send({ emailAdress: "other@server.nl", password: "secret" })
                    .end((err, res) => {
                        const token2 = res.body.data.token;
                        chai.request(server)
                            .delete(`/api/meal/${mealId}`)
                            .set('Authorization', `Bearer ${token2}`)
                            .end((err, res) => {
                                chai.expect(res).to.have.status(403);
                                done();
                            });
                    });
            });
        });
    });

    it('TC-305-3 Maaltijd bestaat niet', (done) => {
        chai.request(server)
            .delete(`/api/meal/9999`)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(404);
                done();
            });
    });

    it('TC-305-4 Maaltijd succesvol verwijderd', (done) => {
        chai.request(server)
            .delete(`/api/meal/${mealId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                done();
            });
    });
});
