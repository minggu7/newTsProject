//회원가입 먼저 진행
export interface signUpType{
    userId: string;
    userPassword: string;
    role?: string;
}

//로그인  역시 회원가입과 독같지만 분리. 혹시 모르니
export interface loginType{
    userId: string;
    userPassword: string;
}

//로그인 응답 타입 (리프레시 토큰 포함)
export interface LoginResponse {
    status: string;
    message: string;
    token?: string;
    refreshToken?: string;
    userId?: string;
}

export interface refreshTokenDeleteReqType{
    status: string;
    message: string;
}