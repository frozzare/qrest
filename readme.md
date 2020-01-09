## qrest

> work in progress

qrest is a http client that concat multiple rest api requests and queries which fields that should be returned using graphql. It only works with rest api requests that returns JSON.

## Examples

```js
const query = `
    currentPost {
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
`;

const data = await qrest.configure({
        'currentPost': {
            path: '/posts/1',
            headers: {
                'x-custom-header': 'true'
            }
        }
    })
    .fetch('https://reqres.in/api', query)
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

To return all fields for a object, simply write `users { _ }` with a underscore as a field.

You can also use graphql arguments as query strings, expect for `id` argument that is added to the url as a path:

```js
const query = `
    posts(id: 1) {
        data {
            name
        }
    }
`;

const data = await qrest.fetch('https://reqres.in/api', query)

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

## Usage

```js
qrest.request(async (url, params) => {
    return await (await fetch(url, params)).json();
});
```

To change to another http client:

```js
const axios = require('axios');

qrest.request(async (url, params) => {
    const res = await axios({
        ...params,
        url: url,
    });

    return res.data;
});
```

To support older browsers we recommend to use [isomorphic-unfetch](https://github.com/developit/unfetch/tree/master/packages/isomorphic-unfetch), a minimal polyfill for fetch which allows for usage on both client and server.