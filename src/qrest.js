const gql = require('graphql-tag');

/**
 * Flatten array.
 *
 * @param {array} list
 *
 * @return {array}
 */
const flattenArray = list =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flattenArray(b) : b), []);

/**
 * Encode objects as query strings.
 *
 * @param {object} params
 * @param {string} prefix
 *
 * @return {string}
 */
const qsEncode = (params, prefix) => {
    const query = Object.keys(params).map(key => {
      const isArray = params.constructor === Array;
      const value = isArray ? flattenArray(params)[key] : params[key];

      if (isArray) {
        key = `${prefix}[]`;
      } else if (params.constructor === Object) {
        key = prefix ? `${prefix}[${key}]` : key;
      }

      if (typeof value === 'object') {
        return qsEncode(value, key);
      }

      return `${key}=${encodeURIComponent(value)}`;
    });

    return [].concat.apply([], query).join('&');
  };

class qrest {
    /**
     * Qet constructor.
     *
     * @param {string} url
     * @param {string} query
     */
    constructor() {
        this.mapSelection = this.mapSelection.bind(this);
        this._configure = {};
        this._request = async (url, options) => {
            return await (await fetch(url, options)).json();
        };
    }

    /**
     * Parse input as a graphql query.
     *
     * @param {string} input
     *
     * @return {array}
     */
    parse(input) {
        const q = gql(`{ ${input} }`);

        return q.definitions[0].selectionSet.selections.map(this.mapSelection)
    }

    /**
     * Map graphql selection to our own format.
     *
     * @param {object} s
     *
     * @return {object}
     */
    mapSelection(s) {
        const out = {
            key: s.name.value,
            arguments: s.arguments,
            children: [],
        };

        if (typeof s.selectionSet !== 'undefined') {
            out.children = s.selectionSet.selections.map(this.mapSelection)
        }

        return out;
    }

    /**
     * Map input against children keys and return output.
     *
     * @param {array|object} input
     * @param {object} output
     * @param {array} children
     *
     * @return {object}
     */
    mapChildren(input = {}, output = {}, children = []) {
        children.forEach(child => {
            if (input[child.key] && child.children.length) {
                output[child.key] = this.mapChildren(input[child.key], output[child.key], child.children);
            } else if (input[child.key]) {
                output[child.key] = input[child.key];
            } else if (input instanceof Array) {
                output = input.map(p => {
                    return this.mapChildren(p, {}, children);
                });
            }
        });

        return output;
    }

    /**
     * Configure aliases and custom headers and options for each request.
     *
     * {
     *   'currentPost': {
     *     path: 'posts/${id}',
     *     headers: {
     *       'content-type': 'application/json'
     *     }
     *   }
     * }
     *
     * @param {object} obj
     */
    configure(obj) {
        this._configure = {
            ...this._configure,
            ...obj
        };

        return this;
    }

    /**
     * Fetch data from endpoints and concat multiple
     * rest api requests and queries which fields
     * that should be returned.
     *
     * @param {string} url
     * @param {string} query
     * @param {object} options
     *
     * @return {object}
     */
    async fetch(url, query, options = {}) {
        const data = {};

        this.url = url;
        query = this.parse(query);

        for (let i = 0, l = query.length; i < l; i++) {
            const row = query[i];
            const key = row.key;
            const config = this._configure[key] ? this._configure[key] : {};

            // Map graphql arguments to query string object.
            let qs = {};
            row.arguments.forEach(arg => {
                qs[arg.name.value] = arg.value.value;
            });

            const url = this._getUrl(key, qs);
            delete config.path;

            const dat = await this._request(url, {
                ...options,
                ...config,
            });

            // Include all fields if first key is a underscore.
            if (row.children[0].key === '_') {
                data[key] = dat;
            } else {
                data[key] = this.mapChildren(dat, {}, row.children);
            }
        }

        return data;
    }

    /**
     * Create request.
     *
     * @param {function} cb
     *
     * @return {object}
     */
    async request(cb) {
        this._request = cb;
        return this;
    }

    /**
     * Create endpoint.
     *
     * @param {string} path
     * @param {object} qs
     *
     * @return {string}
     */
    _getUrl(path, qs = {}) {
        if (this._configure[path] && this._configure[path].path) {
            path = this._configure[path].path;
        }

        const id = qs.id ? '/' + qs.id : '';
        delete qs.id;
        qs = qsEncode(qs);

        const safeURL = this.url.replace(/\/$/, '') + '/';
        const safePath = path.replace(/^\/+/g, '') + id;
        const safeQuery = qs ? '?' + qs : '';

        return safeURL + safePath + safeQuery;
    }
}

module.exports = new qrest;
