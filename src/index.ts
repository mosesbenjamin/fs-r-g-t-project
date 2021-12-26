import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from 'express'
import { ApolloServer } from 'apollo-server-express' 
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import cors from 'cors';
const redis = require('redis')
const session = require('express-session')
const connectRedis = require('connect-redis')

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    const app = express();

    const  RedisStore = connectRedis(session)
    const redisClient = redis.createClient()

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }));
    app.use(
    session({
        name: COOKIE_NAME,
        store: new RedisStore({ 
            client: redisClient,
            disableTouch: true
         }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
            httpOnly: true,
            sameSite: 'lax', // csrf
            secure: __prod__ // cookie only works in https
        },
        saveUninitialized: false,
        secret: 'uigkgkreygfdtdufuydtrsreasdyfuioiuytrdgf',
        resave: false,
    })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res })
    })

    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false})

    app.listen(4000, () => {
        console.log('Server started on localhost:4000')
    })
}

main().catch(err => {
    console.error(err);
})