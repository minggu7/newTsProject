import React, {useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getPostDetail, downloadFile} from '../services/api';
import { Post } from '../types/board';
import { Attachment } from '../types/attachment';

const BoardDetail = () => {
    const location = useLocation();
    const { post: receivedPost } = location.state || {};
    const navigate = useNavigate();

    //굳이 세팅 x 변할 값 없음
    const postInit:Post = {
        myBoardPk: 0,
        myBoardTitle: '',
        myBoardContent: '',
        myBoardAuthor: '',
        myBoardCreatedAt: '',
        myBoardUpdateAt: '',
        myBoardViewCount: 0,
        depth: 0,
        path: ""
    }

    const [attachment, setAttachment] = useState<Attachment[]>([]);

    useEffect(() => {
      //넘어온 BoardPk기준으로 첨부파일만 조회해서 가져오면 됨.
      const getAttachment = async () => {
        try{
          const response = await getPostDetail(receivedPost.myBoardPk);
          console.log('response 데이터는?', response);

          //response 데이터 넣어주기.
          setAttachment(response);
        }catch(error){

        }
      }

      getAttachment();

    }, [receivedPost]);

    const [post, setPost] = useState(receivedPost);//정적 세팅. 변경할 값 없음.

    console.log('receivedPost 데이터는?', receivedPost);

   

    console.log('post 데이터는?', post);

    const moveBoardList = () => {
        //목록 페이지로 이동
        navigate('/board');
    }

    const onClickDownload = async (uuid: string, title: string) => {
      try {
        const blob = await downloadFile(uuid);//blob 타입으로 받아서 옴
        const url = window.URL.createObjectURL(blob);//메모리에 있는 객체에 대한 임시 URL 생성 가능(blob데이터)
        const a = document.createElement('a');//a 태그 생성 해주고
        a.href = url;//url은 로컬 url
        a.download = title;//다운로드 받을 파일 이름
        document.body.appendChild(a);//a 태그 추가
        a.click();//a 태그 클릭(다운로드 자동 진행)
        setTimeout(() => {
          window.URL.revokeObjectURL(url);//위에서 생성한 url 객체( url: 링크? 겠지)를 메모리에서 해제시킴.
        }, 1000);
        a.remove();//필요없긴 한데. 메모리 누수 방지.
      } catch (error) {
        console.error('err', error);
      }
    }
    
    if (!receivedPost) return <div>잘못된 접근입니다.</div>;
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
              <div>
                <label>첨부파일</label>
                <div>
                  {attachment.map((attachmentData) => (
                    // attachment 데이터가 있으면  순회
                    // 미리보기가 필요가 없음.
                    <div
                      key={attachmentData.myAttachmentPk}
                      onClick={() => onClickDownload(attachmentData.uuid || '', attachmentData.myAttachmentTitle)}
                      style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                    >
                        {attachmentData.myAttachmentTitle}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={moveBoardList}
              >목록으로 돌아가기</button>
              <button
              onClick={() => alert('수정 기능 준비중')}
              >
                수정하기
                </button>
              <button
                onClick={() => alert('삭제 기능 준비중')}
              >삭제하기</button>
        </div>
      );
}

export default BoardDetail;