const cache = new Map();

export default function rateLimit(options) {
  const { interval, uniqueTokenPerInterval = 500 } = options;

  return {
    check: (request, limit, token) =>
      new Promise((resolve, reject) => {
        const tokenCount = cache.get(token) || [0, Date.now()];
        if (tokenCount[0] === 0 || Date.now() - tokenCount[1] > interval) {
          tokenCount[0] = 1;
          tokenCount[1] = Date.now();
        } else {
          tokenCount[0]++;
        }

        cache.set(token, tokenCount);

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;

        if (isRateLimited) {
          reject();
        } else {
          resolve();
        }
      }),
  };
}