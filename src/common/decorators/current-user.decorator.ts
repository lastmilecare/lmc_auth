// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);


/*
src/common/
├── guards/
│   ├── jwt-auth.guard.ts        ← verifies JWT, attaches req.user
│   └── permissions.guard.ts     ← checks req.user.permissions[]
└── decorators/
    ├── require-permissions.decorator.ts   ← @RequirePermissions('create:user')
    └── current-user.decorator.ts          ← @CurrentUser() in controllers
*/