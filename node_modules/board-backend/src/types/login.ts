//토큰 발급에 해당하는 로그인 응답값 타입
//토큰 정의에 실패할 시 없는 데이터가 될 수 있으니 상태 빼고 모두 옵셔널
export interface LoginResponse {
    status: string;
    token?: string;
    message: string;
    refreshToken?: string;
    userId? : string;
}