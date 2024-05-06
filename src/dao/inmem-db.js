//
// Onze lokale 'in memory database'.
// We simuleren een asynchrone database met een array van objecten.
// De array bevat een aantal dummy records.
// De database heeft twee methoden: get en add.
// Opdracht: Voeg de overige methoden toe.
//
const database = {
    // het array met dummy records. Dit is de 'database'.
    _data: [
        {
            id: 0,
            firstName: 'Hendrik',
            lastName: 'van Dam',
            emailAdress: 'hvd@server.nl'
            // Hier de overige velden uit het functioneel ontwerp
        },
        {
            id: 1,
            firstName: 'Marieke',
            lastName: 'Jansen',
            emailAdress: 'm@server.nl'
        }
    ],

    // Ieder nieuw item in db krijgt 'autoincrement' index.
    // Je moet die wel zelf toevoegen aan ieder nieuw item.
    _index: 2,
    _delayTime: 500,

    getAll(callback) {
        // Simuleer een asynchrone operatie
        setTimeout(() => {
            // Roep de callback aan, en retourneer de data
            callback(null, this._data)
        }, this._delayTime)
    },

    getById(id, callback) {
        // Simuleer een asynchrone operatie
        setTimeout(() => {
            if (id < 0 || id >= this._data.length) {
                callback({ message: `Error: id ${id} does not exist!` }, null)
            } else {
                callback(null, this._data[id])
            }
        }, this._delayTime)
    },

    add(item, callback) {
        // Simuleer een asynchrone operatie
        setTimeout(() => {
            // Voeg een id toe en voeg het item toe aan de database
            item.id = this._index++
            // Voeg item toe aan de array
            this._data.push(item)

            // Roep de callback aan het einde van de operatie
            // met het toegevoegde item als argument, of null als er een fout is opgetreden
            callback(null, item)
        }, this._delayTime)
    },

    deleteById: (userId, callback) => {
        // Simulate an asynchronous operation
        setTimeout(() => {
            const index = database._data.findIndex(user => user.id === userId);
            if (index === -1) {
                callback({ message: `Error: User with ID ${userId} does not exist!` }, null);
            } else {
                const deletedUser = database._data.splice(index, 1)[0];
                callback(null, deletedUser);
            }
        }, database._delayTime);
    },

    updateById: (userId, newData, callback) => {
        // Simulate an asynchronous operation
        setTimeout(() => {
            const index = database._data.findIndex(user => user.id === userId);
            if (index === -1) {
                callback({ message: `Error: User with ID ${userId} does not exist!` }, null);
            } else {
                // Update user data
                const updatedUser = { ...database._data[index], ...newData };
                database._data[index] = updatedUser;
                callback(null, updatedUser);
            }
        }, database._delayTime);
    }

}

module.exports = database
// module.exports = database.index;
