const serverless = require('serverless-http');
const app        = require('../../server/api');

exports.handler = serverless(app);
