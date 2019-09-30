## Qet

> work in progress

Qet is a http client that concat multiple requests and queries which fields that should be returned.

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

const data = await qet.configure({
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

## Usage

Qet uses [isomorphic-fetch](https://www.npmjs.com/package/isomorphic-fetch) under the hood.

```js
qet.request(async (url, params) => {
    return await (await fetch(url, params)).json();
});
```

To change to another http client:

```js
const axios = require('axios');

qet.request(async (url, params) => {
    const res = await axios({
        ...params,
        url: url,
    });

    return res.data;
});
```
