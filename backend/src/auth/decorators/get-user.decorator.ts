import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom Decorator @GetUser()
 * Digunakan untuk mengambil object user yang telah divalidasi dari Http Request
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
