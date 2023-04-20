const mysql = require('mysql2/promise');
const { mysqlPassword, mysqlUsername, host, database } = require('../settings/config.json');

module.exports = mysql.createConnection({
    host: host,
    user: mysqlUsername,
    password: mysqlPassword,
    database: database,
});
