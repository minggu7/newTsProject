import React, { useState } from 'react';
import { getUserIdFromToken } from '../utils/auth';
import { createPost } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { Attachment } from '../types/attachment';
import { PreviewFile } from '../types/attachment';
import { BoardCreateForm } from '../types/board';
import { useForm } from 'react-hook-form';


const BoardCreate = () => {
  
  const navigate = useNavigate();
  const userId = getUserIdFromToken() as string;

  //form 데이터 처리율 라우트 수정

  //단순 미리보기용
  //DB에 보낼 첨부파일
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  //단순하게 base64로 미리보기만 보여줄거라 문자열 배열로 선언
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);

  //에디터 상태값 관리
  const [editorStyle, setEditorStyle] = useState({
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    //...더 추가할꺼
  })

  //검증 방식 변경. 직접 검증 => react-hook-form 사용 하는것으로.
  //register: 폼 요소 등록, handleSubmit: 폼 제출 핸들러, formState: 폼 상태 관리, setValue: 폼 값 설정, watch: 폼 값 감시
  //userFormReturn<T>구조의 구조분해 할당을 받는거임(동시에 타입추론도)
  //C:\Users\WINITECH\Desktop\타입스 예제 만들어보기\node_modules\react-hook-form\dist\types\form.d.ts
  //위 경로로들어가보면 useForm return에 대한 정보가 있는데. 사용하는 register, handleSubmit, formState, setValue, watch 모두 있음
  const { register, handleSubmit, formState: {errors}, setValue, watch} = useForm<BoardCreateForm>({
    defaultValues: {
      myBoardTitle: '',
      myBoardContent: '',
      myBoardUseYn: 'Y',
      myBoardAuthor: userId,
    }
  });//검증 뚫으면 onSubmit으로 가게됨.

  //실시간 값 감지 (미리보기용)
  const watchedContent = watch('myBoardContent');
  const watchedTitle = watch('myBoardTitle');

  //폼 제출 함수
  const onSubmit = async (data: BoardCreateForm) => {
    //실제 첨부파일 데이터 저장
    const formData = new FormData();

    //1. 게시글 데이터 추가
    formData.append('noticeForm', JSON.stringify(data));

    //2. 첨부파일이 있을 때만 메타데이터 추가
    if(attachments.length > 0){
      formData.append('attachments', JSON.stringify(attachments));

      //3. 실제 파일 데이터 추가(얘는 File 형태니까 굳이 JSON 변환 안해도 됨)
      for(let i = 0; i < attachments.length; i++){
        const previewFile = previewFiles[i];
        if(previewFile && previewFile.base64Url){
          const base64Response = await fetch(previewFile.base64Url);
          const blob = await base64Response.blob();
          formData.append('files', blob, previewFile.originalName);
        }
      }
    }

    console.log('formData 데이터는?', formData);
    console.log('data 데이터는?', data);
    console.log('attachments 데이터는?', attachments);

    //FormData로 최종적으로 요청
    const response = await createPost(formData);
    
    if(response.status === 'success'){
      alert('게시글 작성 성공');
      navigate('/board');
    } else {
      alert('게시글 작성 실패');
    }
  }

  //파일 업로드 로직.
  const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    const fileArr = Array.from(e.target.files);

    // 파일 개수 제한 체크 (최대 5개)
    const maxFiles = 5;
    const currentFileCount = attachments.length;
    if (currentFileCount + fileArr.length > maxFiles) {
      alert(`최대 ${maxFiles}개 파일만 업로드 가능합니다. (현재 ${currentFileCount}개)`);
      return;
    }

    // 파일 크기 제한 체크 (개별 파일 5MB)
    // 조건문 통해서 파일크기 maxFileSize 보다 더 큰거만 찾아서 필터링. oversizedFiles 배열에는 설정 크기보다 큰 파일만 있음
    const maxFileSize = 3 * 1024 * 1024; // 5MB
    const oversizedFiles = fileArr.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      alert(`파일 크기는 5MB 이하여야 합니다. (${oversizedFiles.map(f => f.name).join(', ')} 빼주세요)`);
      return;
    }

    // 파일 타입 체크 (이미지 파일만)
    //위와 같이 allowedTypes 배열에서 허용된 타입 제외한 파일만 찾아서 필터링. 
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = fileArr.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      alert(`지원하지 않는 파일 형식입니다. (${invalidFiles.map(f => f.name).join(', ')} 빼주세요)`);
      return;
    }

    //1. 실제 파일 업로드, 상태값에 저장
    const newAttachments: Attachment[] = [];
    for(let i = 0; i < fileArr.length; i++){//신규 파일 넣기
      const fileData = fileArr[i];
      newAttachments.push({
        myAttachmentTitle:fileData.name,
        myAttachmentType:fileData.type,
        myAttachmentSize:fileData.size,
        myAttachmentEditImg: 'N',//디폴트 N. 나중에 변경. 나머지는 옵셔널이라 패스(서버에서 진행)
        myAttachmentImgSeq: 0,//디폴트는 0 으로 해놨음.
      });
    }
    //기본 파일과 새로 추가한 파일 합한 후(updateAttachments) 최종적으로 reorderAttachments(재렌더링 함수) 호출
    setAttachments(gibonUploadFile => {
      const updatedAttachments = [...gibonUploadFile, ...newAttachments];
      return reorderAttachments(updatedAttachments);
    });//기존 파일에 신규파일 추가하고 순서 재정렬.

    //2. base64 미리보기 추가
    for(let i = 0; i < fileArr.length; i++){
      const fileData = fileArr[i];
      const reader = new FileReader();
      reader.onload = (upLoadNewFile) => {
       const base64Url = upLoadNewFile.target?.result as string;
       const newPreviewFile: PreviewFile = {
        base64Url: base64Url,
        originalName: fileData.name,
       };
       
       setPreviewFiles(prev => [...prev, newPreviewFile]);
       console.log('현재 newPreviewFile 상태값은?', newPreviewFile);
      }
      reader.readAsDataURL(fileData);
    }
    }
    //정상출력. 이미지 잘 출력됨
    console.log('현재 attachments 상태값은?', attachments);
    console.log('현재 previewFiles 상태값은?', previewFiles);
    
    {/* 에디터 관련은 나중에 */}
    {/*
//에디터에 사진 첨부 기능
const insertImageToEditor = (imgSrc: string) => {
  //HTMLTextAreaElement 으로 타입 추론을 해서 selectionStart, selectionEnd 는 number | null로 타입추론 확정 됨
  //개념	설명 HTMLTextAreaElement	<textarea> 전용 타입으로, value, selectionStart 등을 제공
  const textarea = document.querySelector('textarea[name="myBoardContent"]') as HTMLTextAreaElement;
  if (!textarea) return;

  //에디터 인덱스 값만 타입 지정 해주면 됨. 어디서 시작하고 어디서 끝나는지만 해주면 됨.
  //타입 추론 확실하게 해줘야함. selectionStart와 selectionEnd는 number | null로 타입 되어있음. 즉, null을 방지해줘야함
  const start  = textarea.selectionStart as number;
  const end = textarea.selectionEnd as number;
  const value = watchedContent;

  if (start === null || end === null) return; // 안전하게 종료

  //마크다운 이미지 문법 ![대체 텍스트(alt)](이미지_소스_URL)
  const imageMarkdown = `![썸네일 이미지](${imgSrc})`;

  //드래그 잡았을 경우 or 커서위치 기준으로 그 자리에 이미지 넣기
  const newValue =
    value.substring(0, start) +
    imageMarkdown +
    value.substring(end);

    setNoticeForm({
      ...noticeForm,
      myBoardContent: newValue,
    });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
    }, 0);
};
*/}



//에디터 스타일 토글 함수. 요청온 style 키값에 따라 상태값 변경
/*const toggleEditorStyle = (style) => {
  setEditorStyle( editorStyleState => ({
    ...editorStyleState,
    [style]: !editorStyleState[style]
  }));
};
*/



// 첨부파일 순서 재정렬 함수(삭제 및 추가한거에 대해서 그냥 확인)
const reorderAttachments = (attachments: Attachment[]): Attachment[] => {
  return attachments.map((attachment, index) => ({
    ...attachment,
    myAttachmentImgSeq: index + 1//순서할당
  }));
};

// 미리보기/업로드 파일 삭제 함수
const handleRemoveImage = (removeIdx: number) => {
  // 첨부파일에서 삭제하고 순서 재정렬
  const newAttachments = attachments.filter((_, idx) => idx !== removeIdx);//삭제 요청 idx 기준으로 삭제 할거만 삭제
  setAttachments(reorderAttachments(newAttachments));//재정렬
  
  // 미리보기에서 삭제(index 기준으로.)
  setPreviewFiles(previewFiles.filter((_, idx) => idx !== removeIdx));
};

//에디터 - 글씨 굵게(수정함)
const handleBold = () => {
  const textarea = document.querySelector('textarea[name="myBoardContent"]') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = watchedContent;

  if (start === end) return;

  let selectedText = value.substring(start, end);
  let newSelected = selectedText;

  // ***로 감싸져 있으면 굵게+기울임 해제
  if (selectedText.startsWith('***') && selectedText.endsWith('***')) {
    newSelected = selectedText.slice(3, -3);
  }
  // **로 감싸져 있으면 굵게 해제
  else if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
    newSelected = selectedText.slice(2, -2);
  }
  // *로 감싸져 있으면 ***로 감싸기 (굵게+기울임)
  else if (selectedText.startsWith('*') && selectedText.endsWith('*')) {
    newSelected = `***${selectedText.slice(1, -1)}***`;
  }
  // 아무것도 없으면 **로 감싸기(굵게)
  else {
    newSelected = `**${selectedText}**`;
  }

  const newValue = value.substring(0, start) + newSelected + value.substring(end);

  setValue('myBoardContent', newValue);

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start, start + newSelected.length);
  }, 0);
}

//에디터 - 글씨 기울임
const handleItalic = () => {
  const textarea = document.querySelector('textarea[name="myBoardContent"]') as HTMLTextAreaElement;
  if(!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = watchedContent;

  if(start === end) return;

  const selectedText = value.substring(start, end);

  //1. 이미 기울었음
  const isItalic = selectedText.startsWith('*') && selectedText.endsWith('*');
  let newValue, newStart = start, newEnd = end;

  //감싸져있는 경우
  if(isItalic){
    newValue =
      value.substring(0,start) +
      selectedText.slice(1, -1) +
      value.substring(end);

      newEnd = end - 2;//2글자 삭제
  }else{
    newValue=
    value.substring(0, start) +
    '*' +
    selectedText +
    '*' +
    value.substring(end);

    newEnd = end + 2;
  }


  setValue('myBoardContent', newValue);

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(newStart, newEnd);
  }, 0);
};




return (
  <div>
    <h2>게시글 작성 페이지</h2>
      {/*단일 게시글 작성 폼*/}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>게시글 제목</label>
          <input 
            type="text"
            maxLength={50}
            {...register(
              'myBoardTitle',{
                required : '제목을 입력해주세요',
                maxLength: {value: 50, message: '최대 50자 이하로 입력 해주세요'}
              }
            )}
          />
          {errors.myBoardTitle && <span style={{color: 'red'}}>{errors.myBoardTitle.message}</span>}
          <div style={{ 
            color: (watchedTitle || '').length >= 50 ? '#ff4444' : '#888', 
            fontSize: '12px',
            fontWeight: (watchedTitle || '').length >= 50 ? 'bold' : 'normal'
          }}>
            {(watchedTitle || '').length} / 50
          </div>
        </div>


        <div>
          <label>게시글 작성자</label>
          <input
            type="text"
            {...register('myBoardAuthor')}
            disabled
          />
        </div>  

        <div>
          <label>게시글 내용</label> <p></p>
          <button
            type="button"
            onClick={handleBold}//굵은글씨 활성화 호출
            style={{
              marginBottom: '6px',
              marginRight: '6px',
              padding: '4px 8px',
              fontWeight: 'bold',
              border: editorStyle.bold ? '2px solid #1976d2' : '1px solid #aaa',
              borderRadius: '4px',
              background: editorStyle.bold ? '#1976d2' : '#fff',
              color: editorStyle.bold ? '#fff' : '#222',
              boxShadow: editorStyle.bold ? '0 0 8px #1976d2' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            B
          </button>
          <button
            type="button"
            onClick={handleItalic}
            style= {{
              marginBottom: '6px',
              marginRight: '6px',
              padding: '4px 8px',
              fontWeight: 'bold',
              border: '1px solid #aaa',
              borderRadius: '4px',
              background: '#f5f5f5',
              cursor: 'pointer',
            }}
          >
            I
          </button>
          <textarea
            maxLength={1000}
            {...register('myBoardContent', {
              required: '내용을 입력해주세요',
              maxLength: {value : 1000, message :'최대 1000자 이하로 입력 해주세요'}
              })
            }
            style={{
              minHeight: '120px',
              width: '100%',
              padding: '12px',
              border: '1.5px solid #aaa',
              borderRadius: '6px',
              fontSize: '16px',
              resize: 'vertical', //내가 세로로 크기조절 가능하게끔
              boxSizing: 'border-box',
            }}
            placeholder='게시글 내용을 입력해주세요.'
          />
          {errors.myBoardContent && <span style = {{color: 'red'}}>{errors.myBoardContent.message}</span>}
          <div style={{ 
            color: (watchedContent || '').length >= 1000 ? '#ff4444' : '#888', 
            fontSize: '12px',
            fontWeight: (watchedContent || '').length >= 1000 ? 'bold' : 'normal'
          }}>
            {(watchedContent || '').length} / 1000
          </div>
        </div>
            <div style={{ marginTop: '10px', background: '#f9f9f9', padding: '8px'}}>
              <b>미리보기</b>
              <div
                style={{ whiteSpace: 'pre-wrap'}}
                dangerouslySetInnerHTML={{
                  __html: marked(watchedContent || '') as string,
                }}
              >
              </div>
            </div>
        <div>
          <label>사용 여부</label>
          <input
            type="checkbox"
            {...register('myBoardUseYn')}
          />
        </div>

        <div> 
          <input id="imgUpload" type="file" multiple onChange={uploadFile} style={{display: 'none'}}/>
          <button type="button" onClick={() => document.getElementById('imgUpload')?.click()}>이미지 첨부</button>
        </div>
        {/* 미리보기: 파일이 있을 때만, 여러 개 */}
        {previewFiles.map((file, idx) => (
          <div key={idx} style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
            <img
              src={file.base64Url}
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
        <div style={{marginTop: '10px'}}>
          <input type="submit" value="게시글 작성" />
        </div>
        {/*
        <button
          type="submit"
          onClick={handleSubmit}
        >게시글 작성</button>
        */}
      </form>
  </div>
  );
};

export default BoardCreate;