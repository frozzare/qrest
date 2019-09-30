require('isomorphic-fetch');

const gql = require('graphql-tag');

class Qet {
    /**
     * Qet constructor.
     *
     * @param {string} url
     * @param {string} query
     */
    constructor() {
        this.mapSelection = this.mapSelection.bind(this);
        this._configure = {};
        this._request = async (url, params) => {
            return await (await fetch(url, params)).json();
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
     * Configure aliases and custom headers and params for each request.
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
        this._configure = Object.assign(this._configure, obj);
        return this;
    }

    /**
     * Fetch data from endpoints and concat it.
     *
     * @return {object}
     */
    async fetch(url, query, params = {}) {
        this.url = url;
        const data = {};

        query = this.parse(query);

        for (let i = 0, l = query.length; i < l; i++) {
            const row = query[i];
            const key = row.key;
            const endpoint = this.endpoint(key);
            const endParams = this._configure[key] ? this._configure[key] : {};
            if (endParams.path) delete endParams.path;
            const dat = await this._request(endpoint, {
                ...params,
                ...endParams,
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
     *
     * @return {string}
     */
    endpoint(path) {
        if (this._configure[path] && this._configure[path].path) {
            path = this._configure[path].path;
        }

        return this.url.replace(/\/$/, '') + '/' + path.replace(/^\/+/g, '');
    }
}

module.exports = new Qet;
