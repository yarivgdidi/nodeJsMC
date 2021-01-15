const { type } = require("os");

const enviroments = {};

enviroments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging'
}

enviroments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production'
}

const currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
const enviromentToExport = typeof(enviroments[currentEnv]) == 'object' ? enviroments[currentEnv] : enviroments.staging;

module.exports = enviromentToExport;
