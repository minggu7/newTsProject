// 첨부파일(이미지 등) 타입 정의. pk는 forupdate 사용해서 채번 진행할거임.
export interface Attachment {
  myAttachmentPk?: number;
  myAttachmentTitle: string;         // 파일명
  myAttachmentType: string;          // 파일 타입(MIME)
  myAttachmentSize: number;          // 파일 크기(byte)
  myAttachmentEditImg: string;       // 썸네일 여부. 디폴트 설정도 N임
  myAttachmentImgSeq: number;
  url?: string;           // 실제 저장 경로(또는 base64) 서버에서 맞춰줄거임
  uuid?: string;          // 고유 식별자(UUID) 서버에서 맞춰줄거임
  myBoardPk?: number;      // 게시글 번호(게시글 생성시 채번 할거임)
} 

export interface PreviewFile {
    base64Url: string;      //base64 문자열
    originalName: string;   //원본 파일명
}