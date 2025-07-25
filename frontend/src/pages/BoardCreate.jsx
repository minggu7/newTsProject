import React, { useState } from 'react';
import { getUserIdFromToken } from '../utils/auth';
import { createPost } from '../services/api';
import { useNavigate } from 'react-router-dom';

const BoardCreate = () => {
  
  const navigate = useNavigate();
  const userId = getUserIdFromToken();
  const [postImg, setPostImg] = useState([]);//이미지 데이터 저장
  const [previewImg, setPreviewImg] = useState([]);//이미지 미리보기 저장

  //파일 업로드 로직.
  const uploadFile = (e) => {
    //1. 파일 업로드 이벤트 발생 시 파일 배열 가져옴
    const fileArr = Array.from(e.target.files);
    //2. 파일 배열을 상태에 저장(실제 업로드할 파일 데이터)
    setPostImg(fileArr);

    // 3. 여러 개 미리보기용 base64 문자열을 만들기 위한 준비
    const previews = [];
    let loaded = 0;

    //4. 선택한 파일 각각에 대해 FileReader로 접근해서 base64로변환
    fileArr.forEach((file, idx) => {
      const reader = new FileReader();//4-1. 파일리더 생성(읽을 준비)
      reader.onload = (ev) => {//4-3. 먼저 선언만 해놓고 readAsDataURL로 다 읽으면 작동. onload는 파일 다 읽으면 자동 작동함.
        previews[idx] = ev.target.result;//읽은 파일 정보 담아놓고. 다 읽으면 최종반영할 생각
        loaded++;

        //5. 모든 파일 다 읽었을 때만 미리보기 세팅.
        if (loaded === fileArr.length) {
          setPreviewImg(previews);
        }
      };
      // 4-2. 파일을 base64 문자열로 읽기 시작
      reader.readAsDataURL(file);
    });
    if (fileArr.length === 0) setPreviewImg([]);//파일 없으면 미리보기 X 빈 배열로 초기화
  }

  //초기 폼 데이터 세팅. 변화에따라 감지하며 바뀔거임.
  const noticeFormDatainit = {
    myBoardTitle: '',
    myBoardAuthor: userId,
    myBoardContent: '',
    myBoardUseYn: 'Y',
  }

  const [noticeForm, setNoticeForm] = useState(noticeFormDatainit);//초기값 빈 객체

  const handleSubmit = async(e) => {
    //먼저 기본이벤트 동작 방지
    e.preventDefault();

    //현재 noticeForm 데이터만 잘 넘겨주면 됨.

    //먼저 검증이 필요.
    // 제목이 있는지? 게시글 내용이 있는지?
    if(!noticeForm.myBoardTitle || !noticeForm.myBoardContent) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    //이제 데이터 전송.
    const response = await createPost(noticeForm);

    if(response.status === 'success') {
      alert('게시글 작성 성공');
      navigate('/board');
    } else {
      alert('게시글 작성 실패');
    }
    
  }

  //변화에따라 감지하며 바뀔거임.
  const handleChange = (e) => {
    //먼저 구조분해 할당. 받아야할 속성값은 name, value, type, checked
    const {name, value, type, checked} = e.target;
    //이제 객체 업데이트
    setNoticeForm({
      ...noticeForm,
      [name]: type === 'checkbox' ? (checked ? 'Y' : 'N') : value
    });
  }

  // 미리보기/업로드 파일 삭제 함수
  //filter 문법을 통해서 삭제할 인덱스 제외하고 나머지 배열 반환. !== removeIdx 조건으로 해당 조건 만족하는값만 남겨서 필터링
  //즉, x버튼으로 넘어온 removeIdx 인덱스 제외하고 나머지 배열 반환.
  const handleRemoveImage = (removeIdx) => {
    setPreviewImg(previewImg.filter((_, idx) => idx !== removeIdx));
    setPostImg(postImg.filter((_, idx) => idx !== removeIdx));
  };

  return (
    <div>
      <h2>게시글 작성 페이지</h2>
        {/*단일 게시글 작성 폼*/}
        <form>
          <div>
            <label>게시글 제목</label>
            <input 
              type="text"
              name="myBoardTitle"
              value={noticeForm.myBoardTitle}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>게시글 작성자</label>
            <input
              type="text"
              name="myBoardAuthor"
              value={noticeForm.myBoardAuthor}
              onChange={handleChange}
              disabled
            />
          </div>  
          <div>
            <label>게시글 내용</label>
            <textarea
              name="myBoardContent"
              value={noticeForm.myBoardContent}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>사용 여부</label>
            <input
              type="checkbox"
              name="myBoardUseYn"
              value={noticeForm.myBoardUseYn}
              onChange={handleChange}
              checked={noticeForm.myBoardUseYn === 'Y'}
            />
          </div>
          <div>
            <label>이미지 첨부</label>
            <input type="file" multiple onChange={uploadFile} />
          </div>
          {/* 미리보기: 파일이 있을 때만, 여러 개 */}
          {previewImg.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
              {previewImg.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={img}
                    alt={`미리보기${idx + 1}`}
                    style={{ width: '150px', height: '150px', objectFit: 'cover', border: '1px solid #ccc' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
          <button
            type="submit"
            onClick={handleSubmit}
          >게시글 작성</button>
        </form>
    </div>
  );
};

export default BoardCreate;
