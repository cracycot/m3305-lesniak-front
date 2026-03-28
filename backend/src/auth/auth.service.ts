import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import UserRoles from 'supertokens-node/recipe/userroles';
import { Request } from 'express';
import { AuthenticatedUser } from './current-user.decorator';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly initialized: boolean;

    constructor(private readonly config: ConfigService) {
        const connectionUri = config.get<string>('SUPERTOKENS_CONNECTION_URI');
        const apiKey = config.get<string>('SUPERTOKENS_API_KEY');
        const appName = config.get<string>('SUPERTOKENS_APP_NAME', 'Leningrad After Victory');
        const apiDomain = config.get<string>('SUPERTOKENS_API_DOMAIN', 'http://localhost:3080');
        const websiteDomain = config.get<string>('SUPERTOKENS_WEBSITE_DOMAIN', 'http://localhost:3080');

        if (!connectionUri) {
            this.logger.warn(
                'SUPERTOKENS_CONNECTION_URI is not set — auth module running in mock mode. ' +
                'Set env vars to enable real SuperTokens authentication.',
            );
            this.initialized = false;
            return;
        }

        try {
            supertokens.init({
                framework: 'express',
                supertokens: {
                    connectionURI: connectionUri,
                    ...(apiKey ? { apiKey } : {}),
                },
                appInfo: {
                    appName,
                    apiDomain,
                    websiteDomain,
                    apiBasePath: '/auth',
                    websiteBasePath: '/auth',
                },
                recipeList: [
                    EmailPassword.init(),
                    Session.init(),
                    UserRoles.init(),
                ],
            });
            this.initialized = true;
            this.logger.log('SuperTokens initialized successfully');
        } catch (err) {
            this.logger.error('Failed to initialize SuperTokens', err);
            this.initialized = false;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Проверяет сессию SuperTokens и возвращает информацию о пользователе.
     * Возвращает null, если сессия невалидна или SuperTokens не инициализирован.
     */
    async verifySession(req: Request): Promise<AuthenticatedUser | null> {
        if (!this.initialized) return null;

        try {
            const session = await Session.getSession(req, { sessionRequired: false } as never);
            if (!session) return null;

            const userId = session.getUserId();
            const rolesResponse = await UserRoles.getRolesForUser('public', userId);
            const roles = rolesResponse.status === 'OK' ? rolesResponse.roles : [];

            const userInfo = await supertokens.getUser(userId);
            const email = userInfo?.emails?.[0] ?? '';

            return { id: userId, email, roles };
        } catch {
            return null;
        }
    }
}
