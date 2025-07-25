export interface HeaderType {
    title: string;
    url: string;
    explanation: string;
}

export interface QuickMenuType {
    title: string;
    url: string;
    imgUrl: string;
}

export interface SidebarType {
    menuId: number;
    title: string;
    url: string;
    menuLevel: number;
    rootMenuId: number;
    parentMenuId: number;
    sortOrder: number;
    useYn: string;
    createAt: string;
    children?: SidebarType[]; // 재귀 구조(자식 메뉴) 사실 없으면 빈 배열
}