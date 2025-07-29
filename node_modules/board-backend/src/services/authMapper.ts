import { db } from '../db';
import { User, UserSignUpInput, UserLoginInput, RefreshTokenRow } from '../types/auth';

// 아이디 중복 체크
export async function checkUserIdExists(userId: string): Promise<boolean> {
    const result = await db.query(
        `SELECT 1 FROM myboard.my_user WHERE user_id = $1`,
        [userId]
    );
    return (result.rowCount ? result.rowCount : 0) > 0;
}

// 회원가입
export async function insertUser(input: UserSignUpInput): Promise<void> {
    await db.query(
        `INSERT INTO myboard.my_user (user_id, user_password, role) VALUES ($1, $2, $3)`,
        [input.userId, input.userPassword, input.role]
    );
}

// 로그인(유저 정보 조회)
export async function selectUserById(userId: string): Promise<User | null> {
    const result = await db.query(
        `SELECT user_id, user_password, role FROM myboard.my_user WHERE user_id = $1`,
        [userId]
    );
    if (result.rowCount && result.rowCount > 0) {
        const row = result.rows[0];
        return {
            userId: row.user_id,
            userPassword: row.user_password,
            role: row.role
        };
    }
    return null;
}

// 리프레시 토큰 저장 (직접 채번)
export async function insertRefreshToken(row: RefreshTokenRow & { deviceId: string }): Promise<void> {
    await db.query(
        `INSERT INTO myboard.user_refresh_token (ref_token_pk, user_id, refresh_token, created_at, is_valid, expired_at, device_id)
         VALUES ($1, $2, $3, now(), true, now(), $4)`,
        [row.ref_token_pk, row.user_id, row.refresh_token, row.deviceId]
    );
}

// 리프레시 토큰 삭제
export async function deleteRefreshToken(userId: string, refreshToken: string, deviceId: string): Promise<void> {
    await db.query(
        `DELETE FROM myboard.user_refresh_token WHERE user_id = $1 AND refresh_token = $2 AND device_id = $3`,
        [userId, refreshToken, deviceId]
    );
} 