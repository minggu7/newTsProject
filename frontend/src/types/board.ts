import { Attachment } from "./attachment";

// 게시글 타입
export interface Post {
  myBoardPk: number;
  myBoardTitle: string;
  myBoardContent: string;
  myBoardAuthor: string;
  myBoardCreatedAt: string;
  myBoardUpdateAt: string;
  myBoardViewCount: number;
  myBoardParentPk?: number;
  depth: number;
  path: string;//트리경로
  rowNum?: number;//웹 페이지에 표시할 순번
}//예는 상태값 표현을 위한 타입

// 게시글 목록 응답 타입
export interface PostListResponse {
  posts: Post[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}


//게시글 작엇 타입
export interface BoardCreateForm {
  myBoardTitle: string;
  myBoardContent: string;
  myBoardAuthor: string;
  myBoardUseYn: string;
  myBoardCreatedAt?: string;//now처리할거임
  myBoardUpdateAt?: string;//now 처리할거임.
  myBoardViewCount?: number;//디폴트 0 되어있음 일단 옵셔널
  myBoardParentPk?: number;//부모글 없을 수 있음 옵셔널
  depth?: number;//depth의 경우 있을 수도 있고 없을수도 있음
  //다만 만약 자식글이 된다면 부모글의 depth에 따라 추후에 할당 될것임. 일단 옵셔널
}


//게시글 상세 조회 타입
export interface BoardDetail {
  myBoardPk: number;
  myBoardTitle: string;
  myBoardContent: string;
  myBoardAuthor: string;
  myBoardCreatedAt: string;
  myBoardUpdateAt: string;
  myBoardViewCount: number;
  myBoardParentPk: number;
  depth: number;
  path: string;
  attachments: Attachment[];
}