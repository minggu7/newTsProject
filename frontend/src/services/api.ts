import axios from 'axios';
import { Post, PostListResponse } from '../types/board';//ts 설정 가져오기
import { LoginResponse } from '../types/login';
import { refreshTokenDeleteReqType } from '../types/login';
import { tokenType } from '../types/token';
import { CreatePostDataType } from '../types/post';

// API 기본 설정
const API_BASE_URL = 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// 요청 인터셉터 - 토큰 자동 추가(모든 요청에 대해서)
//.api(axios) 사용해서 인터셉터 구현.
//api.interceptors.request.use 는 요청 인터셉터 추가하는거.
//config는? request Interceptors가 작동하기 전 이미 세팅 해놓음
// 요청 => config 세팅 => 인터셉터 작동(config 사용) => 기존 로직 진행
// config값은? url, method, headers, params, data, baseUrl....등
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');//기존 토큰 있으면 그대로 가져오기(정상응답)
    if (token) {//이미 로그인 한 사용자라면 토큰을 헤더에 붙여주기만.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리 및 주기적 리프레시
//당연히 response 는? 넘겨줄 데이터
api.interceptors.response.use(
  (response) => {
    // 정상 응답 처리
    return response;
  },
  (error) => {
    console.log('API 에러 발생:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      // 토큰 관련 문제 (만료, 유효하지 않음)
      console.log('토큰 검증 실패 - 로그인 페이지로 이동');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      // 서버 로직 오류
      console.log('서버 오류 발생:', error.response?.data);
      // 토큰은 유지하고 서버 오류만 표시
    } else {
      // 기타 에러 (400, 403 등)
      console.log('기타 에러 발생:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// deviceId 생성 및 저장 (공통)
let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem('deviceId', deviceId);
}

//아이디 중복 체크(데이터 확인은 count보닫는 exists로 하자. 속도차이 많이 심함)
export const userIdCheck = async (userId: string) : Promise<boolean> => {
    const response = await api.post(`/idCheckProces`, {userId});
    return response.data.exists;
}

//회원가입
export const userSignUp = async (form: { userId: string; userPassword: string; role?: string }): Promise<{ status: string; message: string }> => {
  //성공 or 실패 메시지, 상태값 넘겨주기
  const response = await api.post(`/userSignUp`, form);
  const { status, message } = response.data;
  return { status, message };
}

//로그인 (JWT 토큰 + 리프레시 토큰 저장)
//반환 타입을 주시. LoginResponse로 새로 만듬. 토큰 정보 외에 여러가지 있음.
//각종 토큰 정보 등 있음. 토큰은 그대로 프론트에서 로컬 스토리지에 저장할거임.
export const userLogin = async (form: { userId: string; userPassword: string }): Promise<LoginResponse> => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  const response = await api.post(`/loginProccess`, { ...form, deviceId });
  if (response.data.status === 'success' && response.data.token && response.data.refreshToken) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('userId', response.data.userId);
  }
  return response.data;
};

//로그아웃 시 리프레시 토큰 삭제
export const logoutRefreshTokenOut = async (form: { userRefreshToken: string | null, userId: string | null }): Promise<refreshTokenDeleteReqType> => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  const response = await api.delete('/refreshTokenDelete', {
    params: {
      userId: form.userId,
      userRefreshToken: form.userRefreshToken,
      deviceId
    }
  });
  if(response.data.status == 'success'){
    const logoutRefStatus: refreshTokenDeleteReqType = {
      status : 'success',
      message: '삭제 성공'
    }
    return logoutRefStatus;
  }else{
    const logoutRefStatus: refreshTokenDeleteReqType = {
      status : 'fail',
      message: '삭제 실패'
    }
    return logoutRefStatus;
  }
};

//토큰 검증
export const verifyToken = async (): Promise<{ status: string; message:string; userId?: string }> => {
  const response = await api.get('/verify-token');
  return response.data;//status 값 중요함. 세팅 해줘야함
};

//리프레시 토큰 체크 후 재발급 해줄거임(현재 리프레시 토큰에 권한을 주진 않을거임. 권한값은 AccessToken에서만)
export const refreshTokenCheck = async (form: { refreshToken: string | null, userId: string | null, role?: string | null}): Promise<{ newRefreshToken: string, newAccessToken: string, role?: string }> => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  const response = await api.post('/tokenCheck', { ...form, deviceId });
  return {
    newRefreshToken: response.data.newRefreshToken,
    newAccessToken: response.data.newAccessToken,
    role: response.data.role
  };
};


// 게시글 목록 조회
export const getPosts = async (page: number = 1): Promise<PostListResponse> => {
  //자식 데이터들까지 posts: Post[] 타입 형식으로 다받아서 가져옴.
  const response = await api.get(`/posts?page=${page}`);//해당 url로 요청 보냄
  return response.data;
};

// 게시글 작성
export const createPost = async (postData: CreatePostDataType) => {
  const response = await api.post('/postsCreate', postData);

  return response.data;
}

// 게시글 상세보기
export const getPostDetail = async (myBoardPk: number) => {
  console.log(`getPostDetail 호출됨. myBoardPk는 ${myBoardPk}`);
  const response = await api.post('/postDetail', {myBoardPk});

  return response.data;
}