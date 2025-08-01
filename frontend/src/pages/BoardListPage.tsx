import React, { useState, useEffect } from 'react';//React hook 사용. useState, useEffect 사용
import { Post } from '../types/board';//types 파일 가져옴. 동일하게 적용할 계획
import { getPosts } from '../services/api';//api 파일 가져옴
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/datechange';
import { logoutRefreshTokenOut } from '../services/api';
import { getPostDetail } from '../services/api';

//FC는 FunctionComponent. 함수형 컴포넌트 사용 시 타입 선언에 사용
const BoardListPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);//가져온 게시글 데이터. 배열형태. 초기값은 빈 배열
  const [loading, setLoading] = useState(true);//로딩 상태 Yes or No
  const [error, setError] = useState<string | null>(null);//에러 문자 or null타입
  const navigate = useNavigate();//경로 이동 사용

  useEffect(() => {//접속 시 작동
    const fetchPosts = async () => {//실행 내용 쭉 세팅
      try {
        setLoading(true);//로딩 시작
        const response = await getPosts(1);//getPosts api 요청. page값은 1로.
        //response은 넘어온 데이터 가짐. response.data
        setPosts(response.posts);// 상태값에 가져온 Posts 데이터저장.여러개(배열)
        setError(null);//정상적으로 가져옴. Error 상태값은 null로
      } catch (err) {
        setError('게시글을 불러오는데 실패했습니다.');//에러 메시지 저장
      } finally {
        setLoading(false);//로딩 반드시 종료
      }
    };
    fetchPosts();//접속 시 실행.
  }, []);//의존성 배열 따로 없음. 처음 마운트 될 때 딱 한번만 실행됨

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  const moveCreateBoard = () => {//글 작성하기. 가지고 갈 데이터는?? 따로 없음
    //토큰 검사는 이동 할 때 마다 검사는 app.tsx에서 진행중이니 신경 X 바로 이동 해주면 됨. 라우팅 등록하고
    navigate('/createBoard');
  }

  const movePostDetail = async (post: Post) => {
    navigate('/postDetail', { state: { post } });
  }

  return (
    <div>
      <h1>게시판</h1>
      <button style={{
        marginRight: '20px',
        float: 'right'
      }}
        onClick={moveCreateBoard}
      >
        게시글 작성하기
      </button>
      <table border={1} style={{ minWidth: '1000px', borderCollapse: 'collapse'}}>
        <thead style={{textAlign: 'center'}}>
          <tr>
            <th>순번</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>게시글이 없습니다.</td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.myBoardPk}>
                <td style={{ textAlign: 'center' }}>{post.rowNum}</td>
                <td style={{
                  paddingLeft: `${(post.depth - 1) * 20}px`,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                  onClick={() => movePostDetail(post)}
                  onMouseOver={e => (e.currentTarget.style.background = '#f0f0f0')}
                  onMouseOut={e => (e.currentTarget.style.background = '')}
                >
                  {post.depth !== 1 ? 'ㄴ' : ''}
                  {post.myBoardTitle}
                </td>
                <td style={{ textAlign: 'center' }}>{post.myBoardAuthor}</td>
                <td style={{ textAlign: 'center' }}>{formatDate(post.myBoardCreatedAt)}</td>
                <td style={{ textAlign: 'center' }}>{post.myBoardViewCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BoardListPage;