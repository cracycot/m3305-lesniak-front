import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Факт об историческом объекте' })
export class ObjectFactType {
    @Field(() => Int, { description: 'Уникальный идентификатор факта' })
    id: number;

    @Field({ description: 'Текст факта' })
    text: string;
}
