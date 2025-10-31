import { Reflector } from '@nestjs/core';

export const PermissionsRequired = Reflector.createDecorator<string[]>();
