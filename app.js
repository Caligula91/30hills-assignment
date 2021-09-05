const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const { name } = require('./package.json');
const populateDatabase = require('./lib/populateDB');

const port = process.env.PORT || 8080;
const mongoDB = process.env.MONGO_DB;
const appURL = `http://localhost:${port}/api/v1/`;
mongoose.Promise = global.Promise;

const app = express();

const UserRoutes = require('./components/user/usersRouter');

app.use(express.json({ limit: '10kb' }));

// Create the database connection
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  // eslint-disable-next-line no-console
  console.log(
    `Mongoose default connection open to ${mongoDB}`,
  );
  populateDatabase().then(() => {
    // eslint-disable-next-line no-console
    console.log('Users loaded from data.json file');
  }, () => {
    // eslint-disable-next-line no-console
    console.log('Failed to load data.json file');
  });
});

// CONNECTION EVENTS
// If the connection throws an error
mongoose.connection.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.log(`Mongoose default connection error: ${err}`);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.log('Mongoose default connection disconnected');
});

// When the connection is open
mongoose.connection.on('open', () => {
  // eslint-disable-next-line no-console
  console.log('Mongoose default connection is open');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    // eslint-disable-next-line no-console
    console.log(
      'Mongoose default connection disconnected through app termination',
    );
    process.exit(0);
  });
});

app.use('/api/v1', UserRoutes);

// show env vars
// eslint-disable-next-line no-console
console.log(`__________ ${name} __________`);
// eslint-disable-next-line no-console
console.log(`Starting on port: ${port}`);
// eslint-disable-next-line no-console
console.log(`App url: ${appURL}`);
// eslint-disable-next-line no-console
console.log('______________________________');

app.listen(port);
module.exports = app;
