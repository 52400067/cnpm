import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { sqlClient } from '../database/db';
import Redis from 'ioredis';
import { env } from '../config/env.config';

@Controller('health')
export class HealthController {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  @Get()
  async getHealth() {
    const checks: { database: string; redis: string } = {
      database: 'unknown',
      redis: 'unknown',
    };

    let isHealthy = true;

    try {
      await sqlClient`SELECT 1`;
      checks.database = 'healthy';
    } catch (error) {
      checks.database = 'unhealthy';
      isHealthy = false;
    }

    try {
      if (this.redisClient.status !== 'ready') {
        await this.redisClient.connect();
      }
      const pingRes = await this.redisClient.ping();
      if (pingRes === 'PONG') {
        checks.redis = 'healthy';
      } else {
        checks.redis = 'unhealthy';
        isHealthy = false;
      }
    } catch (error) {
      checks.redis = 'unhealthy';
      isHealthy = false;
    }

    const payload = {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: checks,
    };

    if (!isHealthy) {
      throw new HttpException(payload, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return payload;
  }
}
