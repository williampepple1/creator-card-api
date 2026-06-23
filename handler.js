/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
if (!process.env.__ALREADY_BOOTSTRAPPED_ENVS) {
  require('dotenv').config();
}

const fs = require('fs');
const serverless = require('serverless-http');
const { createServer } = require('@app-core/server');
const { createConnection } = require('@app-core/mongoose');

// Connect to MongoDB on cold start
if (process.env.MONGODB_URI) {
  createConnection({ uri: process.env.MONGODB_URI });
}

// Create the Express app (same as app.js but without starting the server)
const server = createServer({
  port: process.env.PORT || 3000,
  JSONLimit: '150mb',
  enableCors: true,
});

// Load models (required so Mongoose knows about them)
require('@app/models');

// Register endpoints
const ENDPOINT_CONFIGS = [
  {
    path: './endpoints/onboarding/',
  },
  {
    path: './endpoints/creator-cards/',
  },
];

function setupEndpointHandlers(basePath, options = {}) {
  const dirs = fs.readdirSync(basePath);

  dirs.forEach((file) => {
    const endpointHandler = require(`${basePath}${file}`);

    if (options.pathPrefix) {
      endpointHandler.path = `${options.pathPrefix}${endpointHandler.path}`;
    }

    server.addHandler(endpointHandler);
  });
}

ENDPOINT_CONFIGS.forEach((config) => {
  setupEndpointHandlers(config.path, config.options);
});

// Wrap Express app with serverless-http for Lambda + API Gateway
module.exports.handler = serverless(server.app);
