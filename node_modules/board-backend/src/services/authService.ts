import bcrypt from 'bcryptjs';
import { UserSignUpInput, UserLoginInput, User } from '../types/auth';
import { checkUserIdExists, insertUser, selectUserById, insertRefreshToken, deleteRefreshToken } from './authMapper';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/token';
import { db } from '../db';

// 아이디 중복 체크
export async function isUserIdExists(userId: string): Promise<boolean> {
    return await checkUserIdExists(userId);
}

// 회원가입
export async function signUp(input: UserSignUpInput): Promise<{ status: string; message: string }> {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(input.userPassword, 10);
    await insertUser({ ...input, userPassword: hashedPassword });
    return { status: 'success', message: '계정 생성에 성공하였습니다.' };
}

// 로그인
export async function login(input: UserLoginInput): Promise<{ status: string; message: string; token?: string; refreshToken?: string; userId?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const user = await selectUserById(input.userId);
        if (!user) {
            await client.query('ROLLBACK');
            return { status: 'fail', message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }
        const isValidPassword = await bcrypt.compare(input.userPassword, user.userPassword);
        if (!isValidPassword) {
            await client.query('ROLLBACK');
            return { status: 'fail', message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }
        // 토큰 발급
        const token = generateToken(user.userId, user.role);
        const refreshToken = generateRefreshToken(user.userId);
        // 기존 리프레시 토큰 모두 삭제
        await client.query(
            `DELETE FROM myboard.user_refresh_token WHERE user_id = $1 AND device_id = $2`,
            [user.userId, input.deviceId]
        );
        // ref_token_pk 직접 채번
        const { rows } = await client.query(
            `SELECT ref_token_pk FROM myboard.user_refresh_token ORDER BY ref_token_pk DESC LIMIT 1 FOR UPDATE`
        );
        const nextPk = rows.length > 0 ? rows[0].ref_token_pk + 1 : 1;
        // 리프레시 토큰 DB 저장
        await client.query(
            `INSERT INTO myboard.user_refresh_token (ref_token_pk, user_id, refresh_token, created_at, is_valid, expired_at, device_id)
             VALUES ($1, $2, $3, now(), true, now(), $4)`,
            [nextPk, user.userId, refreshToken, input.deviceId]
        );
        await client.query('COMMIT');
        return { status: 'success', message: '로그인에 성공했습니다.', token, refreshToken, userId: user.userId };
    } catch (err) {
        await client.query('ROLLBACK');
        return { status: 'error', message: '서버 오류가 발생했습니다.' };
    } finally {
        client.release();
    }
}

// 토큰 검증
export function verifyAccessToken(token: string): any {
    return verifyToken(token);
}

// 리프레시 토큰 재발급
export async function refreshTokens(userId: string, refreshToken: string, deviceId: string): Promise<{ status: string; newAccessToken?: string; newRefreshToken?: string; message: string }> {
    // 1. 리프레시 토큰 유효성 검사
    const db = require('../db').db;
    const result = await db.query(
        `SELECT 1 FROM myboard.user_refresh_token WHERE refresh_token = $1 AND user_id = $2 AND device_id = $3`,
        [refreshToken, userId, deviceId]
    );
    if ((result.rowCount || 0) === 0) {
        return { status: 'fail', message: '리프레시 토큰이 유효하지 않습니다. 다시 로그인 해주세요.' };
    }
    // 2. 사용자 role 조회
    const userResult = await db.query(
        `SELECT role FROM myboard.my_user WHERE user_id = $1`,
        [userId]
    );
    if (userResult.rowCount === 0) {
        return { status: 'fail', message: '사용자 정보를 찾을 수 없습니다.' };
    }
    const userRole = userResult.rows[0].role;
    // 3. 기존 Refresh Token 삭제 (로테이트)
    await db.query(
        `DELETE FROM myboard.user_refresh_token WHERE refresh_token = $1 AND user_id = $2 AND device_id = $3`,
        [refreshToken, userId, deviceId]
    );
    // 4. 새 토큰 발급
    const newAccessToken = generateToken(userId, userRole);
    const newRefreshToken = generateRefreshToken(userId);
    // 5. 새 Refresh Token DB 저장
    await db.query(
        `INSERT INTO myboard.user_refresh_token (user_id, refresh_token, created_at, is_valid, expired_at, device_id)
         VALUES ($1, $2, now(), true, now(), $3)`,
        [userId, newRefreshToken, deviceId]
    );
    // 6. 새 토큰 반환
    return {
        status: 'success',
        newAccessToken,
        newRefreshToken,
        message: '토큰이 재발급되었습니다.'
    };
} 