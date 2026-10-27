import { Module } from "@nestjs/common";

import { RedisModule } from "../database/redis.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SearchRateLimitGuard } from "./guards/search-rate-limit.guard";

@Module({
  imports: [RedisModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRateLimitGuard],
  exports: [SearchService],
})
export class SearchModule {}
