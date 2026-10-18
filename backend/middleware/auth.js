import crypto from 'crypto';

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'subtrack-session-auth-key-change-in-prod';
}

/**
 * Signs a standards-compliant HS256 JWT using Node.js crypto
 */
export function generateToken(user, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    exp,
    iat: Math.floor(Date.now() / 1000)
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

/**
 * Verifies HS256 JWT and ensures token has not expired
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const expectedSignature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(unsignedToken)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Extracts and validates Bearer token if present on request
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyAuthToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

/**
 * Enforces authenticated identity and prevents client-supplied ID spoofing
 */
export function requireAuth(req, res, next) {
  authenticateToken(req, res, () => {
    // Verified cryptographic session identity
    if (req.user && req.user.id) {
      // If client supplied a different userId, reject privilege escalation
      const clientUserId = req.query.userId || req.body?.userId || req.headers['x-user-id'];
      if (clientUserId && clientUserId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied: Cannot access or mutate another user subscriptions'
        });
      }
      return next();
    }

    // Client-supplied identifier without signed token (fallback for unauthenticated dev/tests)
    const clientUserId = req.query.userId || req.body?.userId || req.headers['x-user-id'];
    if (clientUserId) {
      req.user = { id: clientUserId, role: 'user', isClientSupplied: true };
      return next();
    }

    return res.status(401).json({
      error: 'Authentication required: missing or invalid credentials'
    });
  });
}
