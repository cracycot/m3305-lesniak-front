import { SetMetadata } from '@nestjs/common';

export type UserRole = 'user' | 'admin';

export const ROLES_KEY = 'roles';

/** Требует наличия указанных ролей у пользователя */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
