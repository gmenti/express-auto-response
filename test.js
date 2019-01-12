const assert = require('assert');
const express = require('express');
const plugin = require('./index');

const app = plugin(express());

const response = [
  { id: 1, valid: true },
  { id: 2, valid: false },
  { id: 3, valid: true },
];

app.get('/', req => response);
app.get('/opa', req => {
  throw new NotFoundError('Opa not found');
}, req => response);

class NotFoundError extends Error {
  
  constructor(message) {
    super(message);
    this.code = 'NOT_FOUND';
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
    };
  }
}

app.use((err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(404).send({ code: 'NOT_FOUND', message: err.message });
  }
  res.status(500).send({ code: 'UNEXPECTED_ERROR', message: 'Unknown error' });
});

const port = 1337;

app.listen(port, async (err) => {
  const axios = require('axios');
  const url = `http://localhost:${port}`;

  let res = await axios.get(`${url}/`);
  assert.deepEqual(res.data, response);
  console.log('ok');

  res = await axios.get(`${url}/opa`);
  assert.deepEqual(res.data, response);
  console.log('ok');

  process.exit(0);
});
