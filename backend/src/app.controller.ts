import { Controller, Get, Header, Query, Render } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

function buildSession(auth: string) {
    return auth === '1' ? { name: 'Кирилл', isAuth: true } : null;
}

const GRAPHIQL_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <title>GraphiQL — Ленинград после Победы</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
    <style>body,html,#graphiql{height:100vh;margin:0;}</style>
</head>
<body>
    <div id="graphiql">Загрузка GraphiQL…</div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/graphiql@3/graphiql.min.js" crossorigin></script>
    <script>
        const fetcher = GraphiQL.createFetcher({
            url: '/graphql',
            headers: { 'x-graphiql-client': '1' },
        });
        const root = ReactDOM.createRoot(document.getElementById('graphiql'));
        root.render(React.createElement(GraphiQL, {
            fetcher,
            defaultQuery: \`# Добро пожаловать в GraphiQL!
# Примеры запросов для проекта «Ленинград после Победы»:

query ListObjects {
  objects(page: 1, limit: 10) {
    items {
      id
      title
      year
      category { id name }
      facts { text }
      periods { id name }
    }
    total
    page
    limit
  }
}

# query GetOne {
#   object(id: 1) {
#     id title year description
#     category { name }
#     facts { text }
#   }
# }

# mutation Create {
#   createCategory(input: { name: "Мосты", description: "Мосты города" }) {
#     id name
#   }
# }
\`,
        }));
    </script>
</body>
</html>`;

@Controller()
export class AppController {
    @Get()
    @Render('index')
    getIndex(@Query('auth') auth: string) {
        return { title: 'Главная', user: buildSession(auth) };
    }

    @Get('about')
    @Render('about')
    getAbout(@Query('auth') auth: string) {
        return { title: 'О проекте', user: buildSession(auth) };
    }

    @Get('graphiql')
    @ApiExcludeEndpoint()
    @Header('Content-Type', 'text/html; charset=utf-8')
    getGraphiQL(): string {
        return GRAPHIQL_HTML;
    }
}
