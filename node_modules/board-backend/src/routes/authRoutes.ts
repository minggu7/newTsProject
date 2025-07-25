import express from 'express';
import { isUserIdExists, signUp, login, verifyAccessToken, refreshTokens } from '../services/authService';

const router = express.Router();

// 아이디 중복 체크
router.post('/idCheckProces', async (req, res) => {
    const { userId } = req.body;
    const exists = await isUserIdExists(userId);
    res.json({ exists });
});

// 회원가입
router.post('/userSignUp', async (req, res) => {
    const result = await signUp(req.body);
    res.json(result);
});

// 로그인
router.post('/loginProccess', async (req, res) => {
    const result = await login(req.body);
    res.json(result);
});

// 토큰 검증
router.get('/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'fail', message: '토큰이 없습니다.' });
    }
    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(403).json({ status: 'fail', message: '유효하지 않은 토큰입니다.' });
    }
    return res.json({ status: 'success', message: '토큰이 유효합니다.', userId: decoded.userId });
});

// 리프레시 토큰 재발급
router.post('/tokenCheck', async (req, res) => {
    const { userId, refreshToken, deviceId } = req.body;
    const result = await refreshTokens(userId, refreshToken, deviceId);
    res.json(result);
});

export default router; 