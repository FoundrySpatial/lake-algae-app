const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const devIndexRouter = require('./routes/devIndex');
const apiRouter = require('./routes/api');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// serve message for dev environment, or homepage for prod
if (process.env.NODE_ENV === 'development') {
    app.use('/', devIndexRouter);
} else {
    app.use('/', express.static(path.join(__dirname, 'dist')));
}

app.use('/api', apiRouter);

module.exports = app;
