import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qqqnapppnaopqqqoArfgtodo';
const JWT_EXPIRES_IN = '12h';

// JWT 토큰 생성
export function generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// JWT 토큰 검증
export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// 리프레시 토큰 생성
export function generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
} 