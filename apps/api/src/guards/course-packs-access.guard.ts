import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

// 本地自部署模式：所有课程包（含会员专属）直接放行
@Injectable()
export class CoursePacksAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    context.switchToHttp().getRequest();
    return true;
  }
}
