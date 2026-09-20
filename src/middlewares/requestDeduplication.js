const requestCache = new Map();

function getCacheKey(req) {
  const { method, originalUrl, query } = req;
  const queryString = Object.keys(query).sort().map(k => `${k}=${query[k]}`).join('&');
  return `${method}:${originalUrl}?${queryString}`;
}

function requestDeduplication() {
  return (req, res, next) => {
    // Only deduplicate GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = getCacheKey(req);
    const existing = requestCache.get(cacheKey);

    if (existing) {
      // Request already in progress, wait for it
      console.log(`[RequestDedup] Waiting for existing request: ${req.originalUrl}`);
      existing.promise.then(response => {
        res.json(response);
      }).catch(err => {
        requestCache.delete(cacheKey);
        res.status(500).json({ error: 'Request failed' });
      });
      return;
    }

    // Create new promise for this request
    const promise = new Promise((resolve, reject) => {
      const originalJson = res.json;
      res.json = function(data) {
        resolve(data);
        return originalJson.call(this, data);
      };

      const originalSend = res.send;
      res.send = function(data) {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
        return originalSend.call(this, data);
      };

      const originalEnd = res.end;
      res.end = function(data) {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch {
            resolve(data);
          }
        }
        return originalEnd.call(this, data);
      };
    });

    requestCache.set(cacheKey, { promise, timestamp: Date.now() });

    promise.finally(() => {
      requestCache.delete(cacheKey);
    });

    promise.then(response => {
      // Response already sent by original handler
    }).catch(err => {
      console.error('[RequestDedup] Error:', err);
    });

    next();
  };
}

module.exports = requestDeduplication;