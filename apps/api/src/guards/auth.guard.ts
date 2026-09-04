import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Request } from "express";

export const UncheckAuth = () => SetMetadata("uncheck", true);
export const Permissions = (...permissions: string[]) => SetMetadata("permissions", permissions);

// 本地自部署模式：跳过 Logto JWT 校验，所有请求视为同一个本地用户
export const LOCAL_USER_ID = "local-user";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request["userId"] = LOCAL_USER_ID;
    return true;
  }
}
