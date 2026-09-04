import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { RankController } from "./rank.controller";
import { RankService } from "./rank.service";

// InMemoryRankStore 由 GlobalModule 提供，这里不再重复声明，
// 否则 CourseModule 与 RankModule 会各持一份独立的内存数据
@Module({
  imports: [UserModule],
  controllers: [RankController],
  providers: [RankService],
})
export class RankModule {}
