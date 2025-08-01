import { Board, BoardCreateInput } from '../types/board';
import { selectBoardList, insertBoard, selectBoardDetail } from './boardMapper';
import { PoolClient } from 'pg';

// 게시글 목록 조회
export async function getBoardList(page: number, limit: number): Promise<{ posts: Board[]; totalCount: number; currentPage: number; totalPages: number }> {
    const posts = await selectBoardList(page, limit);
    const totalCount = posts.length;
    const totalPages = Math.ceil(totalCount / limit);
    return { posts, totalCount, currentPage: page, totalPages };
}

// 게시글 작성
export async function createBoard(input: BoardCreateInput, pool?: PoolClient): Promise<{ status: string; message: string; boardPk: number }> {
    const boardPk = await insertBoard(input, pool);
    return { status: 'success', message: '게시글 작성 성공', boardPk};
} 


//게시글 상세보기
export async function getPostDetail(myBoardPk: number) : Promise<Board | null> {
    const result = await selectBoardDetail(myBoardPk);
    return result;
}