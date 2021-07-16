const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log('OOKOK')

var pgp = require('pg-promise')(/* options */)
var db = pgp('postgres://'+ keys.pgUser+':'+ keys.pgPassword+'@'+keys.pgHost+':'+keys.pgPort+'/'+keys.pgDatabase)

db.one('SELECT $1 AS value', 123)
  .then(function (data) {
    console.log('DATA:', data.value)
  })
  .catch(function (error) {
    console.log('ERROR:', error)
  })

// Postgres Client Setup
//const { Pool } = require('pg');
//const pgClient = new Pool({
//  user: keys.pgUser,
//  host: keys.pgHost,
//  database: keys.pgDatabase,
//  password: keys.pgPassword,
//  port: keys.pgPort
//});
//pgClient.on('error', () => console.log('Lost PG connection'));

db
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send(keys.pgUser +''+ keys.pgHost +''+ keys.pgDatabase +''+ keys.pgPassword +''+ keys.pgPort);
});

app.get('/values/all', async (req, res) => {
  const values = await db.query('SELECT * from values');

  res.send(values);
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  db.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});
