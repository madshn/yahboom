// Retry utility with exponential backoff

import { RETRY } from '../config.js';
import { logger } from './logger.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry(fn, context, options = {}) {
  const config = { ...RETRY, ...options };
  let lastError;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries) {
        logger.error(
          `Failed after ${config.maxRetries} attempts: ${error.message}`,
          context
        );
        throw error;
      }

      const delay = Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );

      logger.warn(
        `Attempt ${attempt}/${config.maxRetries} failed, retrying in ${delay}ms`,
        context,
        { error: error.message }
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

export async function withTimeout(fn, timeoutMs, context) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

export default withRetry;
