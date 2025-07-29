import {db} from "../db";
import { Attachment } from "../types/attachment";
import { PoolClient } from 'pg';

//이미지 저장
export async function insertAttachment(attachmentData: Attachment, boardPk: number, pool?: PoolClient): Promise<void> {
    const dbPool = pool || db;
    
    //먼저 채번 진행
    const {rows} = await dbPool.query(
        `
        SELECT my_attachment_pk FROM myboard.my_attachment ORDER BY my_attachment_pk DESC LIMIT 1 FOR UPDATE
        `
    );

    const nextPk = rows.length > 0 ? rows[0].my_attachment_pk + 1 : 1;

    //구조분해 할당 하기
    const {myAttachmentTitle, myAttachmentType, myAttachmentSize, myAttachmentEditImg, myAttachmentImgSeq, url, uuid, myBoardPk} = attachmentData;

    const result = await dbPool.query(
        `
        INSERT INTO myboard.my_attachment (
            my_attachment_pk,
            my_attachment_title,
            my_attachment_type,
            my_attachment_size,
            my_attachment_edit_img,
            my_attachment_img_seq,
            my_attachment_url,
            my_attachment_uuid,
            my_board_pk
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [nextPk, myAttachmentTitle, myAttachmentType, myAttachmentSize, myAttachmentEditImg, myAttachmentImgSeq, url, uuid, myBoardPk]
    );

    //삽입 완료. 반환해줄 값 없음. 종료해도 무방
}

//이미지 가져오기 (BoardPk 기준으로 첨부파일 조회)
export async function getAttachment(boardPk: number): Promise<Attachment[]> {
    const result = await db.query(
        `
            SELECT
                    my_board_pk as "myBoardPk",
                    my_attachment_pk as "myAttachmentPk",
                    my_attachment_title as "myAttachmentTitle",
                    my_attachment_type as "myAttachmentType",
                    my_attachment_size as "myAttachmentSize",
                    my_attachment_edit_img as "myAttachmentEditImg",
                    my_attachment_url as "url",
                    my_attachment_uuid as "uuid",
                    my_attachment_img_seq as "myAttachmentImgSeq"
            FROM myboard.my_attachment
            WHERE my_board_pk = $1
            ORDER BY my_attachment_img_seq ASC
        `,
        [boardPk]
    );

    return result.rows;
}