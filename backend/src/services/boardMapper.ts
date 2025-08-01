import { db } from '../db';
import { Board, BoardCreateInput } from '../types/board';
import { PoolClient } from 'pg';

// 게시글 목록 조회 쿼리
export async function selectBoardList(page: number, limit: number): Promise<Board[]> {
    const offset = (page - 1) * limit;
    const result = await db.query(
        `
        WITH RECURSIVE board_tree AS (
          SELECT
            my_board_pk,
            my_board_title,
            my_board_author,
            my_board_content,
            my_board_create_at,
            my_board_update_at,
            my_board_view_count,
            my_board_parent_pk,
            1 AS depth,
            CAST(my_board_pk AS TEXT) AS path
          FROM myboard.my_board
          WHERE my_board_parent_pk IS NULL

          UNION ALL

          SELECT
            c.my_board_pk,
            c.my_board_title,
            c.my_board_author,
            c.my_board_content,
            c.my_board_create_at,
            c.my_board_update_at,
            c.my_board_view_count,
            c.my_board_parent_pk,
            p.depth + 1 AS depth,
            p.path || '>' || c.my_board_pk AS path
          FROM myboard.my_board c
          JOIN board_tree p ON c.my_board_parent_pk::int = p.my_board_pk
        )
        SELECT
            my_board_pk AS "myBoardPk",
            my_board_title AS "myBoardTitle",
            my_board_content AS "myBoardContent",
            my_board_author AS "myBoardAuthor",
            my_board_create_at AS "myBoardCreatedAt",
            my_board_update_at AS "myBoardUpdateAt",
            my_board_view_count AS "myBoardViewCount",
            my_board_parent_pk AS "myBoardParentPk",
            depth,
            path,
            ROW_NUMBER() OVER (ORDER BY path) AS "rowNum"
        FROM board_tree
        ORDER BY path ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
    );
    return result.rows as Board[];
}

// 게시글 작성 쿼리(첨부파일 이미지 때문에 selectKey 해줘야함. result값에 pk넘겨주면 됨)
export async function insertBoard(input: BoardCreateInput, pool?: PoolClient): Promise<number> {
    const dbPool = pool || db;
    
    // my_board_pk 직접 채번 (동시성 안전)
    const { rows } = await dbPool.query(
        `SELECT my_board_pk FROM myboard.my_board ORDER BY my_board_pk DESC LIMIT 1 FOR UPDATE`
    );
    const nextPk = rows.length > 0 ? rows[0].my_board_pk + 1 : 1;


    const result = 
    // INSERT 쿼리 실행
    // *RETURNING 함수* 추가해서 채번된 pk 받아오기. 작업한 row 데이터를 반환함.
    await dbPool.query(
        `
        INSERT INTO myboard.my_board (
            my_board_pk,
            my_board_title,
            my_board_author,
            my_board_content,
            my_board_use_yn,
            my_board_create_at,
            my_board_update_at
        ) VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING my_board_pk
        `,
        [
            nextPk,
            input.myBoardTitle,
            input.myBoardAuthor,
            input.myBoardContent,
            input.myBoardUseYn
        ]
    );

    //리터닝 사용해서 insert지만 selectKey 와 같이 진행됨
    return result.rows[0].my_board_pk;
}

//게시글 상세보기
export async function selectBoardDetail(myBoardPk: number): Promise<Board | null> {
    const result = await db.query(
        `
            SELECT my_board_pk AS "myBoardPk",
                   my_board_title AS "myBoardTitle",
                   my_board_content AS "myBoardContent",
                   my_board_author AS "myBoardAuthor",
                   my_board_create_at AS "myBoardCreatedAt",
                   my_board_update_at AS "myBoardUpdateAt",
                   my_board_view_count AS "myBoardViewCount",
                   my_board_parent_pk AS "myBoardParentPk",
            FROM myboard.my_board
            WHERE my_board_pk = $1
        `,
        [myBoardPk]
    );
    if (result.rowCount && result.rowCount > 0) {
        return result.rows[0] as Board;
    }
    return null;
} 