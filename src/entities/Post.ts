import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType() // exposes to graphql schema using type-graphql
@Entity()
export class Post {
  @Field() // exposes to graphql schema using type-graphql
  @PrimaryKey()
  _id!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
  
  @Field()
  @Property({type: 'text'})
  title!: string;
}