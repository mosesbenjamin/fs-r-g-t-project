import "reflect-metadata"
import { COOKIE_NAME, __prod__ } from "./constants";
import express from 'express'
import { ApolloServer } from 'apollo-server-express' 
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import cors from 'cors';
import Redis from "ioredis";
import { createConnection } from 'typeorm'
import { Post } from "./entities/Post";
import { User } from "./entities/User";
const session = require('express-session')
const connectRedis = require('connect-redis')

const main = async () => {
    const conn = await createConnection({
        type: 'postgres',
        database: 'lireddit2',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        entities: [Post, User]
    })
    

    const app = express()

    const  RedisStore = connectRedis(session)
    const redis = new Redis();

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }));
    app.use(
    session({
        name: COOKIE_NAME,
        store: new RedisStore({ 
            client: redis,
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
        context: ({ req, res }) => ({ req, res, redis})
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