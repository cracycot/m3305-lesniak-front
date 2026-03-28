# Task 02: LR5 — GraphQL (Code-First with Apollo)

## Objective
Implement a full GraphQL API using the code-first approach with Apollo Server, including queries, mutations, field resolvers, pagination, and query complexity limits.

## Dependencies
- Task 01 must be done (services have proper NotFoundException handling)

## Packages to Install (run in backend/)
```
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

## Files to Create/Modify

### GraphQL Types (Object Types + Input Types)
- `backend/src/objects/dto/object.type.ts` — @ObjectType for HistoricalObject
- `backend/src/objects/dto/object-fact.type.ts` — @ObjectType for ObjectFact
- `backend/src/objects/dto/create-object.input.ts` — @InputType for creating
- `backend/src/objects/dto/update-object.input.ts` — @InputType for updating
- `backend/src/categories/dto/category.type.ts` — @ObjectType for Category
- `backend/src/categories/dto/create-category.input.ts` — @InputType
- `backend/src/categories/dto/update-category.input.ts` — @InputType
- `backend/src/periods/dto/period.type.ts` — @ObjectType for Period
- `backend/src/periods/dto/create-period.input.ts` — @InputType
- `backend/src/periods/dto/update-period.input.ts` — @InputType
- `backend/src/feedback/dto/feedback.type.ts` — @ObjectType for Feedback
- `backend/src/feedback/dto/create-feedback.input.ts` — @InputType
- `backend/src/common/dto/paginated-objects.type.ts` — generic paginated type
- `backend/src/common/dto/pagination.args.ts` — @ArgsType for pagination

### Resolvers
- `backend/src/objects/objects.resolver.ts`
- `backend/src/categories/categories.resolver.ts`
- `backend/src/periods/periods.resolver.ts`
- `backend/src/feedback/feedback.resolver.ts`

### Module updates
- All modules need resolvers added to `providers`
- `backend/src/app.module.ts` — import GraphQLModule

## Implementation Details

### GraphQLModule setup in AppModule
```typescript
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  playground: false,
  plugins: [ApolloServerPluginLandingPageLocalDefault()],
  introspection: true,
  buildSchemaOptions: {
    numberScalarMode: 'integer',
  },
  // Query complexity
  validationRules: [
    // Add complexity plugin below
  ],
})
```

### Pagination Args
```typescript
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Min, Max } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 1 })
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @Min(1)
  @Max(100)
  limit: number = 10;
}
```

### Paginated ObjectType example
```typescript
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { HistoricalObjectType } from './object.type';

@ObjectType()
export class PaginatedObjects {
  @Field(() => [HistoricalObjectType])
  items: HistoricalObjectType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field()
  hasNext: boolean;

  @Field()
  hasPrev: boolean;
}
```

### ObjectType example
```typescript
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class HistoricalObjectType {
  @Field(() => Int, { description: 'Уникальный идентификатор' })
  id: number;

  @Field({ description: 'Название объекта' })
  title: string;

  @Field(() => Int, { description: 'Год' })
  year: number;

  @Field({ nullable: true, description: 'URL изображения' })
  imageUrl?: string;

  @Field({ nullable: true })
  imageAlt?: string;

  @Field({ nullable: true })
  imageCaption?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ description: 'Дата создания' })
  createdAt: Date;

  // category and facts resolved via field resolvers
  @Field(() => CategoryType, { nullable: true })
  category?: CategoryType;

  @Field(() => [ObjectFactType])
  facts: ObjectFactType[];

  @Field(() => [PeriodType])
  periods: PeriodType[];
}
```

### Resolver example (ObjectsResolver)
```typescript
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectsService } from './objects.service';
import { CategoriesService } from '../categories/categories.service';
import { HistoricalObjectType } from './dto/object.type';
import { PaginatedObjects } from './dto/paginated-objects.type';
import { PaginationArgs } from '../common/dto/pagination.args';
import { CreateObjectInput } from './dto/create-object.input';
import { UpdateObjectInput } from './dto/update-object.input';
import { Complexity } from '@nestjs/graphql';

@Resolver(() => HistoricalObjectType)
export class ObjectsResolver {
  constructor(
    private readonly objectsService: ObjectsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Query(() => PaginatedObjects, { description: 'Список исторических объектов с пагинацией', complexity: 5 })
  async objects(@Args() pagination: PaginationArgs): Promise<PaginatedObjects> {
    return this.objectsService.findAllPaginated(pagination.page, pagination.limit);
  }

  @Query(() => HistoricalObjectType, { nullable: true, description: 'Исторический объект по ID', complexity: 2 })
  async object(@Args('id', { type: () => Int }) id: number) {
    return this.objectsService.findOne(id);
  }

  @Mutation(() => HistoricalObjectType, { description: 'Создать исторический объект' })
  createObject(@Args('input') input: CreateObjectInput) {
    return this.objectsService.create(input);
  }

  @Mutation(() => HistoricalObjectType, { description: 'Обновить исторический объект' })
  updateObject(@Args('id', { type: () => Int }) id: number, @Args('input') input: UpdateObjectInput) {
    return this.objectsService.update(id, input);
  }

  @Mutation(() => Boolean, { description: 'Удалить исторический объект' })
  async deleteObject(@Args('id', { type: () => Int }) id: number) {
    await this.objectsService.remove(id);
    return true;
  }

  @ResolveField(() => CategoryType, { nullable: true, complexity: 1 })
  async category(@Parent() obj: HistoricalObjectType) {
    if (!obj.category) return null;
    return this.categoriesService.findOne((obj.category as any).id);
  }
}
```

### Query complexity
Install `graphql-query-complexity`:
```
npm install graphql-query-complexity
```

Add to GraphQLModule config:
```typescript
import { fieldExtensionsEstimator, simpleEstimator, getComplexity } from 'graphql-query-complexity';

// in GraphQLModule plugins or validationRules
```

## Acceptance Criteria
- `http://localhost:3000/graphql` shows Apollo Sandbox
- Schema is visible in sandbox
- Can run query to list objects with pagination
- Can create/update/delete objects via mutations
- Field resolvers work for category, facts, periods
- Query complexity is limited (e.g., max 100)
- All fields have descriptions
