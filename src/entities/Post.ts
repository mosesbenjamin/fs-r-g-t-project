import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@ObjectType() // exposes to graphql schema using type-graphql
@Entity()
export class Post extends BaseEntity{
  @Field() // exposes to graphql schema using type-graphql
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date

  @Field()
  @UpdateDateColumn()
  updatedAt: Date
  
  @Field()
  @Column()
  title!: string;
}