import { Injectable } from "@nestjs/common";

// 进程内内存版有序集合，模拟排行榜用到的 Redis zset 子集
// 语义与 Redis 一致：按 score 降序排名，同分按 member 字典序升序
@Injectable()
export class InMemoryRankStore {
  private sets = new Map<string, Map<string, number>>();

  private getSet(key: string) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Map());
    }
    return this.sets.get(key);
  }

  private sortedEntries(key: string): [string, number][] {
    return Array.from(this.getSet(key).entries()).sort(([memberA, scoreA], [memberB, scoreB]) => {
      if (scoreB !== scoreA) return scoreB - scoreA;
      return memberA < memberB ? -1 : memberA > memberB ? 1 : 0;
    });
  }

  async zadd(key: string, score: number, member: string) {
    this.getSet(key).set(member, score);
    return 1;
  }

  async zincrby(key: string, increment: number, member: string) {
    const set = this.getSet(key);
    const next = (set.get(member) ?? 0) + increment;
    set.set(member, next);
    return String(next);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    const score = this.getSet(key).get(member);
    return score === undefined ? null : String(score);
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    const index = this.sortedEntries(key).findIndex(([m]) => m === member);
    return index === -1 ? null : index;
  }

  async zrevrange(key: string, start: number, stop: number, withScores?: "WITHSCORES") {
    const entries = this.sortedEntries(key).slice(start, stop + 1);
    if (withScores !== "WITHSCORES") {
      return entries.map(([member]) => member);
    }
    return entries.flatMap(([member, score]) => [member, String(score)]);
  }

  async del(key: string) {
    this.sets.delete(key);
    return 1;
  }
}
