```javascript
const manticoresearch = require('node-manticoresearch');

const ms = manticoresearch(); // default
const ms = manticoresearch(9308, '100.100.100.100'); // custom

//---]>
// response: { data: ..., response: ... }
```

Bulk:
```javascript
const r = await ms
    .index('items')
    .insert()
    .bulk([
        // switch 'insert' to 'update'
        // { id: 0, action: 'update', doc: { title: 'Hello #1' }},

        { doc: { a: 1, b: 2, title: 'Hello #1' }},
        { doc: { a: 1, b: 2, title: 'World #1' }},
        { id: 1, doc: { a: 3, b: 4, title: 'Qwerty #1' }}
    ]);

console.log(r.data?.items);
```

Search:
```javascript
const r = await ms
    .index('items')
    .search()
    .limit(1)
    .offset(1)
    .query({ match: { title: 'world' } });

console.log(r.data?.hits);
```

Nested bool query:
```javascript
const r = await ms
    .index('items')
    .search()
    .query((q) => q.and([
        q.is('a', 1),
        q.or([
            q.is('a', 1),
            q.is('b', 2)
        ]),
        q.match('title', 'world'),
    ]));

console.log(r.data?.hits);

// SELECT *FROM items
// WHERE a = 1 and (a = 1 or b = 2) and MATCH('@title world')
```

Nested bool query (short):
```javascript
const r = await ms
    .index('items')
    .search()
    .query(_ => _.and(
        ['a', 0],
        _.or(['a', 1], ['b', 2]),
        _.match('title', 'world')
    ));


console.log(r.data?.hits);

// SELECT *FROM items
// WHERE a = 1 and (a = 1 or b = 2) and MATCH('@title world')
```

Delete by Id:
```javascript
const r = await ms
    .index('items')
    .delete()
    .call('9865535'); // number, string, bigInt

console.log(r.data);
```

Delete by Query:
```javascript
const r = await ms
    .index('items')
    .delete()
    .query({ match: { title: 'hello' } });

console.log(r.data);
```

Delete all:
```javascript
const r = await ms
    .index('items')
    .delete()
    .call();

console.log(r.data);
```

SQL SELECT query via HTTP JSON interface:
```javascript
const raw = false; // default
const r = await ms.sql(`SELECT * FROM items`, raw);

console.log(r.data);
```


## License

MIT
