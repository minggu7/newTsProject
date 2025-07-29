import { Attachment } from "../types/attachment";
import { insertAttachment as insertAttachmentMapper } from "../services/attachmentMapper";
import { PoolClient } from 'pg';
import { getAttachment as getAttachmentMapper } from "../services/attachmentMapper";    

//첨부파일 저장
export async function insertAttachment(attachmentData: Attachment, boardPk: number, pool?: PoolClient): Promise<void> {
    await insertAttachmentMapper(attachmentData, boardPk, pool);
}

//첨부파일 조회
export async function getAttachment(boardPk: number): Promise<Attachment[]> {

    return await getAttachmentMapper(boardPk);
}