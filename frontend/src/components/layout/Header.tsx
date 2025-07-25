import React from 'react';
import { HeaderType } from '../../types/layout';
import { Navigate, useNavigate } from 'react-router-dom';
import { getRoleFromToken, getUserIdFromToken } from '../../utils/auth';

//헤더에 들어갈 내용들. 지정해놓은 타입만 받아냄.
const headerList : HeaderType[] = [
    { title: '홈', url: '/', explanation: '홈으로 이동'},
    { title: '게시판', url: '/board', explanation: '게시판으로 이동'},
    { title: '회원 정보', url: '/mypage', explanation: '회원 정보 페이지로 이동'},
    { title: '로그인', url: '/login', explanation: '로그인 페이지로 이동'},
    { title: '로그아웃', url: '/login', explanation: '로그아웃 페이지로 이동'}
]

//헤더 좌측 메뉴
const leftMenu : HeaderType[] = [
    {title: '홈', url: '/', explanation: '홈으로 이동하기위한 버튼'},
    {title: '게시판', url: '/board', explanation: '게시판으로 이동하는 버튼'},
]

//헤더 중앙 메뉴
const centerMenu : HeaderType[] = [
    {title: '알림 상태', url: '/notification', explanation: '알림 상태 확인 페이지로 이동'}
]

//헤더 우측 메뉴 (기본)
const rightMenu : HeaderType[] = [
    {title: '회원정보', url: '/mypage', explanation: '회원 마이페이지로 이동하는 버튼'},
]

//관리자 전용 메뉴
const adminMenu : HeaderType[] = [
    {title: '관리자 페이지', url: '/adminPage', explanation: '관리자 페이지로 이동하는 버튼'},
]

//flex로 좌 우 중앙 분리
const headerStyle = {
    width: '97.5%',//부모요소 기준 싹 다 차지
    height: '60px',
    background: '#222',
    color: '#fff',
    display: 'flex',//flexbox 사용. 자식들 flex 기준으로 배치
    alignItems: 'center',//컨텐츠들을 세로 중앙 정렬
    padding: '0 20px',//위아래 0 좌우 20
    fontWeight: 700,
    justifyContent: 'space-between'//좌우중앙 공간 균등 분배
};

//헤더 메뉴별로 스타일 적용(좌, 우, 중앙)
const menuGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
}

const itemStyle = {
    marginRight: 24,
    cursor: 'pointer'//마우스 갖다대면 클릭 가능한 표시
};

const Header = () => {

    const navigate = useNavigate();
    const userRole = getRoleFromToken(); // 현재 사용자의 권한 가져오기
    const userId = getUserIdFromToken(); // 현재 사용자의 ID 가져오기

    const movePage = (url: string) => {
        navigate(`${url}`);
    };

    // 로그아웃 처리
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // 권한에 따른 우측 메뉴 구성
    const getRightMenu = () => {
        const baseMenu = [...rightMenu];
        
        // 관리자인 경우 관리자 메뉴 추가
        if (userRole === 'admin') {
            baseMenu.unshift(...adminMenu); // 맨 앞에 추가
        }
        
        // 로그인 상태에 따라 로그인/로그아웃 메뉴 추가
        if (userId) {
            // 로그인된 상태: 로그아웃 메뉴 표시
            baseMenu.push({title: '로그아웃', url: '#', explanation: '로그아웃'});
        } else {
            // 로그인되지 않은 상태: 로그인 메뉴 표시
            baseMenu.push({title: '로그인', url: '/login', explanation: '로그인 페이지로 이동하는 버튼'});
        }
        
        return baseMenu;
    };

    return (
        <header style={headerStyle}>
            <div style={menuGroupStyle}>
                {leftMenu.map(item => (
                    <div
                        key={item.title}
                        style={itemStyle}
                        onClick={() => movePage(item.url)}//인터셉터는 당연히 안거침 하지만 app.tsx의 토큰검증 받음
                        title={item.title}
                    >
                        {item.title}
                    </div>
                ))}
            </div>
            <div style={menuGroupStyle}>
                {centerMenu.map(item => (
                    <div
                        key={item.title}
                        style={itemStyle}
                        onClick={() => movePage(item.url)}
                        title={item.title}
                    >
                        {item.title}
                    </div>
                ))}
            </div>
            <div style={menuGroupStyle}>
                {getRightMenu().map(item => (
                    <div
                        key={item.title}
                        style={itemStyle}
                        onClick={() => {
                            if (item.title === '로그아웃') {
                                handleLogout();
                            } else {
                                movePage(item.url);
                            }
                        }}
                        title={item.title}
                    >
                        {item.title}
                    </div>
                ))}
                {/* userId가 있음녀 표시 */}
                {userId && (
                    <div>
                        {userId}님 반갑습니다.
                    </div>
                )}
            </div>


    </header>
    )
}

export default Header;