## qrest

> work in progress

qrest is a http client that concat multiple rest api requests and queries which fields that should be returned using graphql. It only works with rest api requests that returns JSON. All things that works in graphql will not work qrest, e.g fragments, mutation, variables and directives.

## Example

```js
const query = `
  {
    currentPost: posts(id: 1) {
      data {
        name
      }
    }
    posts {
      data
    }
    users {
      page
    }
  }
`;

const data = await qrest.get('https://reqres.in/api', query)
/*

Data object:

{
  users: { page: 1 },
  posts: {
    data: [ [Object], [Object], [Object], [Object], [Object], [Object] ]
  },
  currentPost: { data: { name: 'cerulean' } }
}

*/
```

qrest also support `query` operation type.

To return all fields for a object, simply write `users { _ }` with a underscore as a field.

### Configure

You can configure custom headers and options for query objects using `configure`

```js
qrest.configure({
  'currentPost': {
    path: '/posts/1',
    headers: {
      'x-custom-header': 'true'
    }
  }
})

const query = `
  {
    currentPost {
      data {
        name
      }
    }
  }
`
```

### Query arguments

Query arguments will be converted to query strings, expect for `id` argument that is added to the url as a path:

```js
const query = `
  {
    posts(id: 1) {
      data {
        name
      }
    }
  }
`;

const data = await qrest.get('https://reqres.in/api', query)

/*

Data object:

{
  posts: {
    data: {
      id: 1,
      name: 'cerulean',
      year: 2000,
      color: '#98B2D1',
      pantone_value: '15-4020'
    }
  }
}

*/
```

### Query alias

```js
const query = `
  {
    currentPost: posts(id: 1) {
      data {
        name
      }
    }
  }
`;

const data = await qrest.get('https://reqres.in/api', query)

/*

Data object:

{
  currentPost: {
    data: {
      id: 1,
      name: 'cerulean',
      year: 2000,
      color: '#98B2D1',
      pantone_value: '15-4020'
    }
  }
}

*/
```

### Request aliases:

```js
qrest.get(url, query, options)
qrest.post(url, query, options)
qrest.put(url, query, options)
qrest.patch(url, query, options)
qrest.head(url, query, options)
qrest.delete(url, query, options)
```

To support older browsers we recommend to use [isomorphic-unfetch](https://github.com/developit/unfetch/tree/master/packages/isomorphic-unfetch), a minimal polyfill for fetch which allows for usage on both client and server.

To change to another http client:

```js
const axios = require('axios');

qrest.request(async (url, options) => {
  const res = await axios({
    ...options,
    url: url,
  });

  return res.data;
});
```