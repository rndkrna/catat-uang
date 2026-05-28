import { Context, Next } from 'hono';

// Authentication middleware
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // TODO: Verify JWT token
  // const token = authHeader.replace('Bearer ', '');
  // const decoded = await verifyToken(token);
  
  await next();
};
