import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { course, coursePack } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";
import { LOCAL_USER_ID } from "../guards/auth.guard";
import { UserCourseProgressService } from "../user-course-progress/user-course-progress.service";
import { UserEntity } from "../user/user.decorators";
import { UpdateUserDto } from "./model/user.dto";

// 本地自部署模式：用户资料不再依赖 Logto，会员直接视为有效
@Injectable()
export class UserService {
  constructor(
    @Inject(DB) private db: DbType,
    private readonly userCourseProgressService: UserCourseProgressService,
  ) {}

  async findUser(uId: string) {
    return {
      id: uId,
      username: uId === LOCAL_USER_ID ? "我" : uId,
    };
  }

  /**
   * 返回当前登录用户的信息
   * 本地模式下直接视为会员
   * @param uId
   * @returns
   */
  async findCurrentUser(uId: string) {
    return {
      membership: { isMember: true, details: null },
    };
  }

  async updateUser(user: UserEntity, dto: UpdateUserDto) {
    return { data: dto };
  }

  async setupNewUser(user: UserEntity, dto: { username: string; avatar: string }) {
    if (!dto.avatar) {
      dto.avatar = this.getAvatarUrl();
    }

    const { id, courses } = await this.db.query.coursePack.findFirst({
      where: eq(coursePack.order, 1),
      with: {
        courses: {
          where: eq(course.order, 1),
        },
      },
    });

    await this.userCourseProgressService.upsert(user.userId, id, courses.at(0).id, 0);
    return {
      avatar: dto.avatar,
      username: dto.username,
    };
  }

  private getAvatarUrl() {
    const order = this.getRandomNumber();

    return `https://earthworm-prod-1312884695.cos.ap-beijing.myqcloud.com/avatars/avatar${order}.png`;
  }

  private getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1;
  }
}
