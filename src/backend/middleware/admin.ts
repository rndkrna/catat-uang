import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export const adminMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized (No Token)' }, 401);
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return c.json({ success: false, message: 'Forbidden (Not an Admin)' }, 403);
    }
    
    c.set('admin', decoded);
    await next();
  } catch (error) {
    return c.json({ success: false, message: 'Unauthorized (Invalid Token)' }, 401);
  }
};
