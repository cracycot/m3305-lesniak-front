import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает эндпоинт как публичный — AuthGuard его пропускает */
export const PublicAccess = () => SetMetadata(IS_PUBLIC_KEY, true);
