export interface Board {
    myBoardPk: number;
    myBoardTitle: string;
    myBoardContent: string;
    myBoardAuthor: string;
    myBoardCreatedAt: string;
    myBoardUpdateAt: string;
    myBoardViewCount: number;
    myBoardParentPk: number | null;
    depth: number;
    path: string;
    rowNum: number;
}

export interface BoardCreateInput {
    myBoardTitle: string;
    myBoardAuthor: string;
    myBoardContent: string;
    myBoardUseYn: string;
} 