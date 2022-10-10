const superagent = require('superagent');
const Agent = require('agentkeepalive');

const JSONbig = require('json-bigint');

//-----------------------------------------------------

const keepaliveAgent = new Agent({
    maxSockets: 1,
    keepAliveMsecs: 1000 * 10
});

const JSONbig_rlyBig = JSONbig({
    alwaysParseAsBig: true,
    useNativeBigInt: true
});

//-----------------------------------------------------

module.exports = manticoresearch;

//-----------------------------------------------------
// https://manual.manticoresearch.com/Searching/Filters#Nested-bool-query

function go(func) {
    const listToEquals = (input) => {
        if(Array.isArray(input)) {
            const [name, v] = input;
            return { equals: { [name]: v } };
        }

        return input;
    };

    const result = {
        andNot(...args) { return { bool: { must_not: [...args].map(listToEquals) } }; },

        and(...args) { return { bool: { must: [...args].map(listToEquals) } }; },
        or(...args) { return { bool: { should: [...args].map(listToEquals) } }; },

        is(name, v) { return { equals: { [name]: v } }; },
        term(name, v) { return { term: { [name]: v } }; },

        in(name, list) { return { in: { [name]: list } }; },
        range(name, range) { return { range: { [name]: range } }; },

        match(name, v) { return { match: { [name]: v } }; },
        qs(name, v) { return { query_string: { [name]: v } }; },
    };

    //---]>

    return func ? func(result) : result;
}

//-----------------------------------------------------

function manticoresearch(port = 9308, host = '127.0.0.1', agent = null) {
    const baseUrl = 'http://' + host + ':' + port + '/json/';

    //-)>

    const req = (v) => superagent
        .post(baseUrl + v)
        .agent(agent || keepaliveAgent)
        .set('Content-Type', 'application/x-ndjson')
        .buffer(true)
        .parse((res, cb) => {
            let data = Buffer.from('');

            res.on('data', (chunk) => data = Buffer.concat([data, chunk]));
            res.on('end', () => cb(null, data.toString()));
        });

    //-)>

    const pack = (d) => JSONbig.stringify(d);
    const unpack = (response) => {
        if(response == null || response.status == 204) {
            return null;
        }

        return JSONbig.parse(response.body);
    };

    const toAsync = (worker) => {
        return new Promise((resolve, reject) => {
            worker.end((error, response) => {
                if(error) {
                    reject(error);
                }
                else {
                    try {
                        resolve({ data: unpack(response), response });
                    }
                    catch(e) {
                        reject(e);
                    }
                }
            });
        });
    };

    //---]>

    return {
        _index: '',
        _action: '',

        __bind(type, v) {
            let t = this;

            if(!t._binded) {
                t = Object.create(this);
                t._binded = true;
            }

            t[type] = v;

            return t;
        },

        //---]>

        index(name) { return this.__bind('_index', name); },

        search() { return this.__bind('_action', 'search'); },
        delete() { return this.__bind('_action', 'delete'); },
        insert() { return this.__bind('_action', 'insert'); },
        replace() { return this.__bind('_action', 'replace'); },
        update() { return this.__bind('_action', 'update'); },

        limit(v) { return this.__bind('_limit', v); },
        offset(v) { return this.__bind('_offset', v); },

        //---]>

        bulk(items) {
            const index = this._index;
            const action = this._action;

            const data = items.reduce((p, c) => {
                const record = { [c.action || action]: ({ index: c.index || index, id: c.id, doc: c.doc }) };
                return p + (p ? '\n' : '') + pack(record);
            }, '');

            return toAsync(req('bulk').send(data));
        },
        query(q, params = {}) {
            const data = pack({
                limit: this._limit,
                offset: this._offset,

                ...params,

                index: this._index,
                query: typeof q === 'function' ? go(q) : q
            });

            return toAsync(req(this._action).send(data));
        },
        call(id, params = {}) {
            const data = pack({
                ...params,

                index: this._index,
                id: typeof id === 'string' ? JSONbig_rlyBig.parse(id) : id
            }, true);

            return toAsync(req(this._action).send(data));
        },

        //---]>

        go
    };
}
