import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query( () => [Post]) //set graphql type
    posts(@Ctx() { em }: MyContext): Promise<Post[]> { // set typescript type
        return em.find(Post, {})
    }

    @Query( () => Post, { nullable: true })
    post(
        @Arg('_id') _id: number,
        @Ctx() { em }: MyContext
        ): Promise<Post | null> {
        return em.findOne(Post, { _id })
    }

    @Mutation( () => Post)
    async createPost(
        @Arg('title') title: string,
        @Ctx() { em }: MyContext
        ): Promise<Post> {
        const post = em.create(Post, { title })
        await em.persistAndFlush(post)
        return post
    }

    @Mutation( () => Post, { nullable: true })
    async updatePost(
        @Arg('_id') _id: number,
        // @Arg('title') title: string,
        @Arg('title', () => String, { nullable: true }) title: string,  // for optional args
        @Ctx() { em }: MyContext
        ): Promise<Post | null> {
        const post = await em.findOne(Post, {_id})
        if(!post) {
            return null
        }
        if(typeof title != 'undefined') {
            post.title = title
            await em.persistAndFlush(post)
        }
        return post
    }

    @Mutation( () => Boolean)
    async deletePost(
        @Arg('_id') _id: number,
        @Ctx() { em }: MyContext
        ): Promise<boolean> {
        await em.nativeDelete(Post, { _id })
        return true
    }
}