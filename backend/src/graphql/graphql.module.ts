import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { GraphQLError } from 'graphql';
import { CategoriesModule } from '../categories/categories.module';
import { ObjectsModule } from '../objects/objects.module';
import { PeriodsModule } from '../periods/periods.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { CategoriesResolver } from './resolvers/categories.resolver';
import { ObjectsResolver } from './resolvers/objects.resolver';
import { PeriodsResolver } from './resolvers/periods.resolver';
import { FeedbackResolver } from './resolvers/feedback.resolver';

const MAX_COMPLEXITY = 200;

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            sortSchema: true,
            csrfPrevention: false,
            playground: false,
            introspection: true,
            context: ({ req, res }) => ({ req, res }),
            formatError: (error: GraphQLError) => ({
                message: error.message,
                extensions: error.extensions,
            }),
            buildSchemaOptions: {
                dateScalarMode: 'timestamp',
            },
            plugins: [
                // Apollo Sandbox — встроенная UI-песочница для GraphQL (аналог Swagger).
                // Local-вариант работает и в dev, и в prod. Для альтернативного UI
                // есть отдельная страница /graphiql (классический GraphiQL).
                ApolloServerPluginLandingPageLocalDefault({ embed: true, footer: false }),
                {
                    async requestDidStart(requestContext) {
                        const schema = requestContext.schema;
                        return {
                            async didResolveOperation({ document, request }) {
                                const complexity = getComplexity({
                                    schema,
                                    operationName: request.operationName,
                                    query: document,
                                    variables: request.variables,
                                    estimators: [
                                        fieldExtensionsEstimator(),
                                        simpleEstimator({ defaultComplexity: 1 }),
                                    ],
                                });
                                if (complexity > MAX_COMPLEXITY) {
                                    throw new GraphQLError(
                                        `Query complexity ${complexity} exceeds the maximum allowed complexity of ${MAX_COMPLEXITY}.`,
                                    );
                                }
                            },
                        };
                    },
                },
            ],
        }),
        CategoriesModule,
        ObjectsModule,
        PeriodsModule,
        FeedbackModule,
    ],
    providers: [
        CategoriesResolver,
        ObjectsResolver,
        PeriodsResolver,
        FeedbackResolver,
    ],
})
export class AppGraphQLModule {}
