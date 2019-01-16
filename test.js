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
  throw new Error('Message not visible');
});

app.all('*', req => {
  throw new NotFoundError('Route not found');
});

const port = 1337;

app.use((err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(404).send({ code: 'NOT_FOUND', message: err.message });
  }
  res.status(500).send({ code: 'UNEXPECTED_ERROR', message: 'Unknown error' });
});

app.listen(port, async (err) => {
  const axios = require('axios');
  const url = `http://localhost:${port}`;

  try {
    const res = await axios.get(`${url}/`);
    assert.deepEqual(res.data, response);
    console.log('ok');
  } catch (err) {
    console.error('err', err.message)
  }

  try {
    await axios.get(`${url}/opa`);
  } catch (err) {
    assert.deepEqual(err.response.data, {
      code: 'UNEXPECTED_ERROR',
      message: 'Unknown error',
    });
    console.error('ok')
  }

  try {
    await axios.get(`${url}/not-found`);
  } catch (err) {
    assert.deepEqual(err.response.data, {
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
    console.error('ok')
  }
  
  process.exit(0);
});

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
