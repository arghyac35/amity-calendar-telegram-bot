import 'reflect-metadata'; // We need this in order to use @Decorators

import config from './config';

import express from 'express';

import Logger from './loaders/logger';

import { createServer, Server } from 'http';
import socketIoHandlers from './socketEventHandlers/eventHandlers'

async function startServer() {
  const app = express();

  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({ expressApp: app });

  const server: Server = createServer(app);

  server.listen(config.port, () => {
    Logger.info(`
    ################################################
    🛡️  Server listening on port: ${config.port} 🛡️
    ################################################
  `);
  }).on('error', err => {
    Logger.error(err);
    process.exit(1);
  });

  const io = require("socket.io")(server, {
    cors: {
      origin: config.domain,
      methods: ["GET", "POST"]
    }
  });

  socketIoHandlers(io)
}

startServer();