const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    "development": {
        "username": process.env.POSTGRES_USERNAME,
        "password": process.env.POSTGRES_PASSWORD,
        "database": process.env.POSTGRES_DB,
        "host": process.env.POSTGRES_HOST,
        "port": process.env.POSTGRES_PORT,
        "dialect": process.env.POSTGRES_DIALECT
    },
    "test": {
        "username": process.env.POSTGRES_USERNAME,
        "password": process.env.POSTGRES_PASSWORD,
        "database": process.env.POSTGRES_DB,
        "host": process.env.POSTGRES_HOST,
        "port": process.env.POSTGRES_PORT,
        "dialect": process.env.POSTGRES_DIALECT
    },
    "production": {
        "username": process.env.POSTGRES_USERNAME,
        "password": process.env.POSTGRES_PASSWORD,
        "database": process.env.POSTGRES_DB,
        "host": process.env.POSTGRES_HOST,
        "port": process.env.POSTGRES_PORT,
        "dialect": process.env.POSTGRES_DIALECT
    }
}