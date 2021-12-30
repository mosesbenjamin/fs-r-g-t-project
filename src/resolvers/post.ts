import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../entities/Post";

@Resolver()
export class PostResolver {
    @Query( () => [Post]) //set graphql type
    posts(): Promise<Post[]> { // set typescript type
        return Post.find()
    }

    @Query( () => Post, { nullable: true })
    post(
        @Arg('id') id: number
    ): Promise<Post | undefined> {
        return Post.findOne(id)
    }

    @Mutation( () => Post)
    async createPost(
        @Arg('title') title: string
        ): Promise<Post> {
            // two sql queries
        return Post.create({ title }).save();
    }

    @Mutation( () => Post, { nullable: true })
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, { nullable: true }) title: string,  // for optional args
        ): Promise<Post | null> {
        const post = await Post.findOne({ where: [ id ] })
        if(!post) {
            return null
        }
        if(typeof title != 'undefined') {
            await Post.update({id}, {title})
        }
        return post
    }

    @Mutation( () => Boolean)
    async deletePost(
        @Arg('id') id: number
        ): Promise<boolean> {
        await Post.delete(id)
        return true
    }
}