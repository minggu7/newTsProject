import express from 'express';
import { getBoardList, createBoard } from '../services/boardService';

const router = express.Router();

// 게시글 목록 조회
router.get('/posts', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const result = await getBoardList(page, limit);
    res.json(result);
});

// 게시글 작성
router.post('/postsCreate', async (req, res) => {
    const input = req.body;
    const result = await createBoard(input);
    res.json(result);
});

export default router; 