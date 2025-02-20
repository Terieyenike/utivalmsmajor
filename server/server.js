import express from 'express';
import session from 'express-session';
import formData from 'express-form-data';
import connectPg from 'connect-pg-simple';
import 'express-async-errors';
import cookieParser from 'cookie-parser';
import debug from 'debug';
import logger from 'morgan';
import chalk from 'chalk';
import cors from 'cors';
import os from 'os';
import { config } from 'dotenv';
import path from 'path';
import roles from './helpers/roles';
import usession from './middlewares/user_session';
import Routes from './routes/v1';
import db from './database/models';

config();
const log = debug('dev');
const app = express();

// express.\
// const isProd = process.env.NODE_ENV === 'production';

// Options for media upload to backend for cloudinary
const options = {
  uploadDir: os.tmpdir(),
  autoClean: true,
};

app.use(formData.parse(options));
app.use(formData.format());
app.use(formData.stream());
app.use(formData.union());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

const Pgstore = connectPg(session);

const whitelist = process.env.whiteList.split(',');
const corsOptions = {
  origin(origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Content-Type',
  ],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../site/build')));

app.use(
  session({
    store: new Pgstore(),
    name: 'utiva',
    // Persisting your sessions change isProd to true if you want constant persistence
    saveUninitialized: false,
    resave: false,
    secret: process.env.APP_SECRET,
    cookie: {
      maxAge: 172800 * 1000, // maximum cookie duration is 2 days
      sameSite: true,
      secure: false,
    },
  })
);

app.use(usession.main(session, roles));

app.get('/api/v1', (req, res) =>
  res.status(200).json({
    message: 'Welcome to utiva',
  })
);

// Routes(app);
app.use('/api/v1', Routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../site/build', 'index.html'));
});

// to catch a 404 and send to error handler
app.use((req, res) =>
  res.status(404).json({
    status: 404,
    error: `Route ${req.url} Not found`,
  })
);

// Finally, check db connection then start the server...
const { sequelize } = db;

sequelize
  .authenticate()
  .then(() => {
    log('Sequelize connection was successful');
  })
  .catch((err) => {
    log(chalk.yellow(err.message));
  });

// sequelize.sync();

// app error handler, to handle sync and asyc errors
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if (res.headersSent) return next(err);

  console.log(err);
  return res.status(err.status || 500).json({
    status: res.statusCode,
    error: err.message,
  });
});

export default app;
