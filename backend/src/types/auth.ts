//토큰 저장에 사용할 타입 정의.(서버에서 정의 하기 때문에 타입 생성)
export interface RefreshTokenRow {
    ref_token_pk : number;
    user_id : string;
    refresh_token : string;
    created_at : Date;
    expired_at: Date | null;
    is_valid: boolean;
}

// 유저 정보
export interface User {
    userId: string;
    userPassword: string;
    role: string;
}

// 회원가입 요청
export interface UserSignUpInput {
    userId: string;
    userPassword: string;
    role: string;
}

// 로그인 요청
export interface UserLoginInput {
    userId: string;
    userPassword: string;
    deviceId: string;
}