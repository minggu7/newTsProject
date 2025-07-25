import { jwtDecode } from 'jwt-decode';

export const getRoleFromToken = (): string | null => {
  const token = localStorage.getItem('token');//로컬 스토리지에서 토큰 가져오고
  if (!token) return null;//없으면 아웃
  
  try {
    const decoded: any = jwtDecode(token);//있으면 가져온 토큰 디코딩
    return decoded.role;//payload 에서 role값만 추출
  } catch {
    return null;
  }
};

export const getUserIdFromToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded: any = jwtDecode(token);
    return decoded.userId;
  } catch {
    return null;
  }
}; 