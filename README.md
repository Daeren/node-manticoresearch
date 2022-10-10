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

        { doc: { title: 'Hello #1' }},
        { doc: { title: 'World #1' }},
        { id: 1, doc: { title: 'Qwerty #1' }}
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


## License

MIT
