import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import QuickMenu from './QuickMenu';

//전체 레이아웃
const layoutStyle = {
    display: 'flex',//전체 화면 flexbox로 구성
    flexDirection: 'column',//자식들은 세로 방향으로 쌓기( 좌측 사이드바, 중앙 메인 콘텐츠, 상단 헤더, 우측 퀵메뉴로 할거니까 )
    height: '100vh',//브라우저 전체 높이 기준
    fontFamily: 'Roboto, Arial, sans-serif',
};

//콘텐츠 영역에 적용할 스타일
const contentStyle = {
    display: 'flex',//콘텐츠 내부 요소들을 수평 정렬할 수 있도록 flex 컨테이너로 설정.
    flex: 1 //layoutStyle에서 할당된 공간 중 가능한 많은 영역 차지함.
            //  > 콘텐츠 영역이 남는 공간을 모두 차지하게 해서 헤더, 푸터 등 자기 영역 꽉 채우기
};

//
const mainStyle = {
    flex: 1, //부모가 flex 컨테이너이면 해당 요소는 해당 영역 가득 채움
    padding: 24,
    background: '#f9f9f9'
};


// 공통 적용 레이아웃 구현. childern은 해당 컴포넌트 안에 감싸진 내용들이다.
// 위 스타일 자체가 전체 구조를 잡아준다. 먼저 가장 상위에 layoutStyle을 덮어준다.
// 그리고 다음으로 중요한것은 children은 AppLayout 안에서 동적으로 바뀌는 메인 콘텐츠 영역.
//  > 즉, 동적으로 변경될 컴포넌트이다.

//Header의 경우 항상 맨 위에 고정.
//content의 경우 가로로 구성되어잇다. flexDirection: 'column'안했으니.
//그 다음 Siderbar 는 좌측에 배치.
// main은 중앙 주요 콘텐츠이고
// quickMenu는 우측 퀵 메뉴이다.
//즉, content를 기준으로 왼쪽 사이드바, 중앙 메인 콘텐츠, 우측 퀵 메뉴 형식으로 가로로 쭉 배치하겠다는거
const AppLayout =({ children }) => {

    return (
        <div style = {layoutStyle}>
            <Header />
            <div style = {contentStyle}>
                <Sidebar />
                <main style = {mainStyle}>{children}</main>
                <QuickMenu />
            </div>
        </div>
    )
}

export default AppLayout;