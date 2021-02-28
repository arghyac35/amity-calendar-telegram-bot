# amity-calendar-telegram-bot architecture 🛡️

TODO

## Development

We use `node` version `12.16.1`

The first time, you will need to run

```
npm install
```

Then just start the server with

```
npm run start
```
It uses nodemon for livereloading :peace-fingers:

__If u see errors regarding python then run__

```
npm install --global --production windows-build-tools --vs2015
```
#### Important note

_If you run this command without any additional flags, you’ll install the files associated with the latest version of Visual Studio, which is VS2017 at the time of writing. However, node-gyp requires the v140 distributable, not the v150 (which comes with VS2017). This is why the --vs2015 flag is added to the end of the command, since that’s the last version of Visual Studio that came with the v140 package. You can see more notes about that near the bottom of the package’s wbsite._

_Hopefully, that’s all it will take for you to get everything installed._

# API Validation

 By using celebrate the req.body schema becomes clary defined at route level, so even frontend devs can read what an API endpoint expects without need to writting a documentation that can get outdated quickly.

 ```js
 route.post('/signup',
  celebrate({
    body: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
    }),
  }),
  controller.signup)
 ```

 **Example error**

 ```json
 {
  "errors": {
    "message": "child \"email\" fails because [\"email\" is required]"
  }
 }
 ```

[Read more about celebrate here](https://github.com/arb/celebrate) and [the Joi validation API](https://github.com/hapijs/joi/blob/v15.0.1/API.md)

**Some important mongodb commands:**

1. To take a dump of local db
```bash
mongodump --db <dbName>
```

2. To restore a dump in local db
```bash
mongorestore --db <TorestoreInDbName> --verbose folder/path/of/dump/files

E.x: mongorestore --db googolplexProd --verbose dump/prod
```

3. To restore a particular collection in local db
```bash
mongorestore --db <TorestoreInDbName> --verbose --collection <collectionName>  path/to/collection.bson --drop

E.x: mongorestore --db googolplexProd --verbose --collection users  dump/prod/users.bson --drop
```

4. To take a dump of remote db
```bash
mongodump --host <dbUrl> --ssl --username <uname> --password <password> --authenticationDatabase admin --db <dbName>

e.x: mongodump --host Cluster0-shard-0/cluster0-shard-00-00-ogymv.mongodb.net:27017,cluster0-shard-00-01-ogymv.mongodb.net:27017,cluster0-shard-00-02-ogymv.mongodb.net:27017 --ssl --username arghya --password 123456 --authenticationDatabase admin --db prod
```

4. To restore a particualr collection in remote db
```bash
mongorestore --host Cluster0-shard-0/cluster0-shard-00-00-ogymv.mongodb.net:27017,cluster0-shard-00-01-ogymv.mongodb.net:27017,cluster0-shard-00-02-ogymv.mongodb.net:27017 --ssl --username arghya --password 123456 --authenticationDatabase admin --db test --verbose dump/prod
```

# Roadmap
TODO


# FAQ

TODO
