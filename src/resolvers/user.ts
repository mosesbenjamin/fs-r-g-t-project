import { MyContext } from "src/types";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "../entities/User";
import argon2 from 'argon2'
import { COOKIE_NAME } from '../constants'
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";

@ObjectType()
class FieldError {
    @Field()
    field: string

    @Field()
    message: string

}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export class UserResolver {
    // @Mutation(() => Boolean)
    // async forgotPassword(
    //     @Ctx() {} : MyContext,
    //     @Arg('email') email: string
    // ) {
    //     // const user = await em.findOne(User, { email })
    //     return true;
    // };

    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { em, req }: MyContext
    ) {
        // you are not logged in
        if(!req.session.userId) return null;

        const user = await em.findOne(User, { id: req.session.userId })
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options)
        if (errors) return { errors };

        const hashedPassword = await argon2.hash(options.password)
        const user = em.create(User, { 
            email: options.email,
            username: options.username,
            password: hashedPassword
         })
        try {
            await em.persistAndFlush(user);
        } catch (error) {
             // duplicate username error
            if(error.code === '23505') {
                return {
                    errors: [{
                        field: 'username',
                        message: 'username has already been taken'
                    }]
                }
            }
        }

        // store user id session
        // this will set a cookie on the user and keep them
        // logged in
        req.session.userId = user.id;
        
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password')  password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User,
            usernameOrEmail.includes('@')
            ? {email: usernameOrEmail}
            :{ username: usernameOrEmail })
        if(!user) {
            return {
                errors: [{
                    field: 'usernameOrEmail',
                    message: 'incorrect username or password'
                }]
            }
        }
        const valid = await argon2.verify(user.password, password)
        if(!valid) {
            return {
                errors: [{
                    field: 'password',
                    message: 'incorrect username or password'
                }]
            }
        }

        req.session.userId = user.id;
        
        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() {req, res} : MyContext
    ) {
        return new Promise(resolve => req.session.destroy(err => {
            res.clearCookie(COOKIE_NAME)
            if(err) {
                console.error(err)
                resolve(false)
                return
            }
            resolve(true)
        }))
    }
}