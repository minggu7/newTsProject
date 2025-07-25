import React, { useEffect } from 'react';
import './App.css';
import BoardListPage from './pages/BoardListPage';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';//검증 실패시 팅구기
import { verifyToken } from './services/api';//토큰검증
import { refreshTokenCheck } from './services/api';
import BoardCreate from './pages/BoardCreate';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import BoardDetail from './pages/BoardDetail';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  //페이지 접속 시 세팅 + 주기적 토큰 갱신(검증도 당연하게 이루어짐)
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');//엑세스 토큰 가져오기
      const currentPath = location.pathname;//location.pathname은 현재 페이지의 경로를 반환 /posts 같은0000000
      
      // 로그인/회원가입 페이지는 권한 검사 제외
      const publicPaths = ['/login', '/signUp', '/'];
      const isPublicPath = publicPaths.includes(currentPath);//includes 통해서 완전 일치한다면 통과
      
      if (token === '' || !token) { // AccessToken이 없는 경우
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');

        if (refreshToken) { // refreshToken이 존재하는 경우 검사 진행
          try {
            const response = await refreshTokenCheck({ refreshToken, userId });
            if (response.newAccessToken && response.newRefreshToken) {
              // 성공 시에만 갱신
              localStorage.setItem('token', response.newAccessToken);
              localStorage.setItem('refreshToken', response.newRefreshToken);
              console.log('App.tsx - 리프레시 토큰 갱신 성공, localStorage 업데이트됨');
              // 재발급 받았음
              return;
            } else {
              // 실패 시 삭제 및 이동(로컬 스토리지 비워주기)
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userId');
              localStorage.removeItem('role');
              if (!isPublicPath) {
                navigate('/login');
              }
              return;
            }
          } catch (err) {
            // 실패 시 삭제 및 이동(로컬 스토리지 비워주기)
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('role');
            if (!isPublicPath) {
              navigate('/login');
            }
            return;
          }
        } else { // refreshToken이 존재하지 않는 경우
          if (!isPublicPath) {
            navigate('/login');
          }
          return;
        }
      }

      try {
        const res = await verifyToken();//토큰 검증.
        if (res.status !== 'success') {
          //검증실패 회원이 아님
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          if (!isPublicPath) {
            navigate('/login');
          }
        }
        //혹시나 토큰 검증에 성공하거나 재발급 받은 상황이라면 ? 자동 로그인 유지
      } catch (err) {
        console.log(`토큰 권한이 아예 없습니다. ${err}`);
        //기존에 있다면 삭제
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        if (!isPublicPath) {
          navigate('/login');
        }
      }
    }
    
    // 초기 토큰 검증
    checkToken();
    
    // 1시간마다 토큰 갱신
    const intervalId = setInterval(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      const userId = localStorage.getItem('userId');
      
      if (refreshToken && userId) {
        try {
          const response = await refreshTokenCheck({ refreshToken, userId });
          if (response.newAccessToken && response.newRefreshToken) {
            localStorage.setItem('token', response.newAccessToken);
            localStorage.setItem('refreshToken', response.newRefreshToken);
            console.log('App.tsx - 주기적 리프레시 토큰 갱신 성공');
          }
        } catch (error) {
          console.log('App.tsx - 주기적 리프레시 토큰 갱신 실패:', error);
        }
      }
    }, 3600000); // 1시간 (60분 * 60초 * 1000ms)
    
    // 컴포넌트 언마운트 시 interval 정리
    return () => clearInterval(intervalId);
  }, [navigate, location.pathname]);

  return (
    <AppLayout>
      <Routes>
          <Route path="/" element={<HomePage/>}></Route>
          <Route path="/board" element={<BoardListPage/>}></Route>
          <Route path="/login" element={<LoginPage/>}></Route>
          <Route path="/signUp" element={<SignUp/>}></Route>
          <Route path="/createBoard" element={<BoardCreate/>}></Route>
          <Route path="/postDetail" element={<BoardDetail/>}></Route>
      </Routes>
    </AppLayout>
  );
}

export default App;
