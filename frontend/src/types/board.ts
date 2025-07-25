// 게시글 타입
export interface Post {
  myBoardPk: number;
  myBoardTitle: string;
  myBoardContent: string;
  myBoardAuthor: string;
  myBoardCreatedAt: string;
  myBoardUpdateAt: string;
  myBoardViewCount: number;
  myBoardParentPk: number;
  depth: number;
  path: string;//트리경로
  rowNum: number;//웹 페이지에 표시할 순번
}//예는 상태값 표현을 위한 타입

// 게시글 목록 응답 타입
export interface PostListResponse {
  posts: Post[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
