require('isomorphic-fetch');

const http = require('http');
const test = require('ava');
const listen = require('test-listen');
const qrest = require('./src/qrest');
const axios = require('axios');

const server = (req, res) => {
  res.writeHeader(200, {
    'Content-Type': 'application/json'
  });

  let json = '{}';

  switch (req.url) {
    case '/posts':
      json = '{"page":1,"per_page":6,"total":12,"total_pages":2,"data":[{"id":1,"name":"cerulean","year":2000,"color":"#98B2D1","pantone_value":"15-4020"},{"id":2,"name":"fuchsia rose","year":2001,"color":"#C74375","pantone_value":"17-2031"}]}';
      break;
    case '/users':
      json = '{"page":1,"per_page":6,"total":12,"total_pages":2,"data":[{"id":1,"email":"george.bluth@reqres.in","first_name":"George","last_name":"Bluth","avatar":"https://s3.amazonaws.com/uifaces/faces/twitter/calebogden/128.jpg"},{"id":2,"email":"janet.weaver@reqres.in","first_name":"Janet","last_name":"Weaver","avatar":"https://s3.amazonaws.com/uifaces/faces/twitter/josephstein/128.jpg"}]}';
      break;
    case '/posts/1':
      json = '{"data":{"id":1,"name":"cerulean","year":2000,"color":"#98B2D1","pantone_value":"15-4020"}}';
      break;
    default:
      break;
  }

  res.write(json);
  res.end();
};

test.before(async t => {
  t.context.server = http.createServer(server);
  t.context.baseURL = await listen(t.context.server);
});

test.after.always(t => {
  t.context.server.close();
});

test('get single query data', async t => {
  const query = `
        users {
            page
        }
    `;

  const actual = await qrest.get(t.context.baseURL, query);
  const expected = {
    users: {
      page: 1
    }
  };

  t.deepEqual(expected, actual);
});

test('post single query data', async t => {
  const query = `
        users {
            page
        }
    `;

  const actual = await qrest.post(t.context.baseURL, query);
  const expected = {
    users: {
      page: 1
    }
  };

  t.deepEqual(expected, actual);
});

test('get multiple query data', async t => {
  const query = `
        users {
            page
        }
        posts {
            data {
                name
            }
        }
    `;

  const actual = await qrest.get(t.context.baseURL, query);
  const expected = {
    users: {
      page: 1
    },
    posts: {
      data: [
        {
          name: 'cerulean'
        },
        {
          name: 'fuchsia rose'
        }
      ]
    }
  };
  t.deepEqual(expected, actual);
});

test('get dynamic query name', async t => {
  const query = `
        currentPost {
            data {
                name
            }
        }
    `;

  qrest.configure({
    currentPost: {
      path: '/posts/1'
    }
  });

  const acutal = await qrest.get(t.context.baseURL, query);
  const expected = {
    currentPost: {
      data: {
        name: 'cerulean'
      }
    }
  };

  t.deepEqual(expected, acutal);
});

test('use graphql arguments as query strings', async t => {
  const query = `
    posts(id: 1) {
        data {
            name
        }
    }
  `;

  const acutal = await qrest.get(t.context.baseURL, query);
  const expected = {
    posts: {
      data: {
        name: 'cerulean'
      }
    }
  };

  t.deepEqual(expected, acutal);
});

test('axios dynamic query name', async t => {
  const query = `
        currentPost {
            data {
                name
            }
        }
    `;

  qrest.configure({
    currentPost: {
      path: '/posts/1'
    }
  }).request(async (url, params) => {
    const res = await axios({
      ...params,
      url: url
    });

    return res.data;
  });

  const acutal = await qrest.get(t.context.baseURL, query);
  const expected = {
    currentPost: {
      data: {
        name: 'cerulean'
      }
    }
  };

  t.deepEqual(expected, acutal);
});
