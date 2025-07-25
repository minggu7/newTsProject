import React, {useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getPostDetail} from '../services/api';

const BoardDetail = () => {
    const location = useLocation();
    const { myBoardPk } = location.state || {};
    const navigate = useNavigate();

    const postInit = {
        myBoardPk: 0,
        myBoardTitle: '',
        myBoardContent: '',
        myBoardAuthor: '',
        myBoardUpdateAt: '',
        myBoardViewCount: 0
    }

    const [post, setPost] = useState(postInit);

    useEffect(() => {
        if (!myBoardPk) return; // myBoardPk가 없으면 실행하지 않음
        const fetchPostDetail = async () => {
            try {
                const response = await getPostDetail(myBoardPk);
                //조회 성공 시 해당 값 게시글 상태값에 세팅

                //데이터 가져옴. 세팅 필요
                setPost(response);//DB에서 as로 이름 잘 맞추기
            } catch (error) {
                console.error('게시글 조회 실패:', error);
            }
        }
        fetchPostDetail();
    }, [myBoardPk]);

    const boardUpdate = (myBoardPk) => {
        //업데이트 페이지로 이동
    }

    const boardDelete = (myBoardPk) => {
        //즉시 삭제 요청
    }

    const moveBoardList = () => {
        //목록 페이지로 이동
        navigate('/board');
    }
    
    if (!myBoardPk) return <div>잘못된 접근입니다.</div>;
    if (!post || !post.myBoardTitle) return <div>로딩 중...</div>;

     return (
        <div>
          <h2>게시글 상세보기 페이지</h2>
            {/*단일 게시글 작성 폼*/}
              <div>
                <label>게시글 제목</label>
                <input 
                  type="text"
                  name="myBoardTitle"
                  value={post.myBoardTitle}
                  disabled
                />
              </div>
              <div>
                <label>게시글 작성자</label>
                <input
                  type="text"
                  name="myBoardAuthor"
                  value={post.myBoardAuthor}
                  disabled
                />
              </div>  
              <div>
                <label>게시글 내용</label>
                <textarea
                  name="myBoardContent"
                  value={post.myBoardContent}
                  disabled
                />
              </div>
              <button
                onClick={moveBoardList}
              >목록으로 돌아가기</button>
              <button
              onClick={() => boardUpdate(myBoardPk)}
              >
                수정하기
                </button>
              <button
                onClick={() => boardDelete(myBoardPk)}
              >삭제하기</button>
        </div>
      );
}

export default BoardDetail;