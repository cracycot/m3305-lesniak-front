import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const start = performance.now();
        const contextType = context.getType<'http' | 'graphql'>();

        let res: Response | null = null;
        if (contextType === 'http') {
            res = context.switchToHttp().getResponse<Response>();
        }

        return next.handle().pipe(
            tap(() => {
                const elapsedMs = Math.round(performance.now() - start);

                if (contextType === 'graphql' || (contextType === 'http' && res)) {
                    if (res) {
                        // Некоторые обработчики (redirect/stream) могли уже отправить ответ.
                        if (!res.headersSent && !res.writableEnded) {
                            res.setHeader('X-Elapsed-Time', `${elapsedMs}ms`);
                        }
                        // locals можно выставлять всегда — для MVC отрисовки (если она ещё будет)
                        res.locals.elapsedTime = elapsedMs;
                    }
                }
            }),
        );
    }
}
