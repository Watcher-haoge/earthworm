import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { InMemoryRankStore } from "../rank/rank.store";
import { DB, DbProvider } from "./providers/db.provider";

const envConfig = {
  prod: ".env.prod",
  test: ".env.test",
};

const envFilePath = envConfig[process.env.NODE_ENV] || ".env";
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: envFilePath,
      isGlobal: true,
    }),
  ],
  providers: [DbProvider, InMemoryRankStore],
  exports: [DB, InMemoryRankStore],
})
export class GlobalModule {}
