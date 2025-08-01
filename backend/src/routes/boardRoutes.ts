import express from 'express';
import { getBoardList, createBoard, getPostDetail } from '../services/boardService';
import { BoardCreateInput } from '../types/board';
import {v4 as uuidv4} from 'uuid';
import { localSaveFile } from '../types/attachment';
import { insertAttachment } from '../services/attachmentService';
import fs from 'fs';//FileSystem 모듈 사용
import path from 'path';//경로 모듈 사용
import {promisify} from 'util';//promise 모듈 사용(콜백 지옥 해결).
//promisify는 콜백 패턴을 사용. 중첩된 코드 없이 간결한 코드로 비동기 작업 가능
//존의 콜백 기반 함수를 Promise로 바꿔줘서 async/await 문법을 사용할 수 있게 해줌
import multer from 'multer';//클라이언트가 전송한 데이터중 "파일 업로드" 를 처리하기위해 꼭 필요한 미들웨어
//exporess는  Content-Type: multipart/form-data; 형식을 받아들이지못함.(멀티파트 못받는다는거같음)
//그래서? multer이 필요.  multer이 파일은 파일로, 텍스트는 텍스트대로 파싱해줌
import { db } from '../db';
import { getAttachment } from '../services/attachmentService';
import { Attachment } from '../types/attachment';
// 백엔드에서 폼 데이터 검증
import { body, validationResult } from 'express-validator';
// 폼 데이터ㅏ 검증 미들웨어. (위에 validationResult 는 json 객체 검증 하지못함)
// Ajv import 추가
import Ajv from 'ajv';

//ajv 인스턴스 생성
const ajv = new Ajv({ allErrors: true });//스키마 유효성 검사 시 발생 가능한 모든 에러 수집.(사용할 수 있게끔)

//게시글 데이터 JSON 스키마 정의
const boardDataSchema = {
    type: "object",//타입은 JSON 객체
    properties: {//검증 할 프로퍼티는 myBoardTitle, myBoardContent
        myBoardTitle: {
                        type: "string",
                        minLength: 1,
                        maxLength: 50
                    },
        myBoardContent: {
                        type: "string",
                        minLength: 1,
                        maxLength: 1000
                    },
        myBoardAuthor: {
                        type: "string",
                        minLength: 1
                    },
        myBoardUseYn: {
                        type: "string",
                        enum: ["Y", "N"]
                    }//추후에 이미지 사이즈도 진행
    },
    required: ["myBoardTitle", "myBoardContent", "myBoardAuthor", "myBoardUseYn"],//반드시 포함되어야 할 필드 목록(필수여부)
    additionalProperties: false//지정된 필드 외에 다른 키 받지않음. true로 하면 받음
    };

    //생성된 스키마 컴파일
    const validateBoardData = ajv.compile(boardDataSchema);


const writeFile = promisify(fs.writeFile);//파일 읽기. 근데? promisify 형태로 읽음
//이렇게 읽었을때 장점?

//multer 설정 추가
//먼저 임시 저장경로 추가. 임시로 파일 복사해둘곳
//업로드 => 게시글 생성 => 파일 저장 로직에서 임시로 가지고있다가 => 최종 반영 후 삭제
const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            // 임시 저장 경로가 없으면 자동 생성
            if (!fs.existsSync('C:\\Users\\WINITECH\\Desktop\\임시저장경로')) {
                fs.mkdirSync('C:\\Users\\WINITECH\\Desktop\\임시저장경로', { recursive: true });
            }
            callback(null, 'C:\\Users\\WINITECH\\Desktop\\임시저장경로');
        },
        filename: (req, file, callback) => {
            callback(null, file.originalname);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB (개별 파일 크기 제한)
        files: 5, // 최대 5개 파일
        fieldSize: 2 * 1024 * 1024, // 2MB (필드 크기 제한)
        fieldNameSize: 50, // 필드명 크기 제한
        fields: 10, // 최대 필드 개수
        parts: 20, // 최대 파트 개수 (파일 + 필드)
        headerPairs: 2000 // 헤더 쌍 개수 제한
    },//MulterError: Too many files.... 오류 확인. 정상작동중
    fileFilter: (req, file, callback) => {
        // 허용할 파일 타입 체크
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true); // 파일 허용
        } else {
            callback(null, false); // 파일 거부
        }
    }
});


const router = express.Router();

// 게시글 목록 조회
router.get('/posts', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const result = await getBoardList(page, limit);
    res.json(result);
});

// 게시글 작성(라우팅은 여기서 url연결 해주는데. 서비스는 게시글 먼저 진행 후 첨부파일 진행)
// 0. uuid생성
// 1. 트랜잭션 처리는 잘 되는가? (테스트)
// 2. 게시글 작성 -> pk 넘겨주고 -> 이미지 DB에 저장하는 과정은 잘 이루어지고있는가?
// 3. 최종적으로 로컬에 저장 되는가?

// 뜬금없는 두 번째 인자 값은 뭘까? 이는 복수개의 파일을 배열 형태로 받아내기 위함이다.
// 프론트에서 files는 실제 파일들의 배열이다.
// 즉, 실제 파일을 받겠다는건데. 여기서 multer 미들웨어가 upload.array('files') 요청을 받아서 파싱한다.
// 결과적으로 왜 굳이  이렇게할까? 이유는 브라우저가 보내는 파일 데이터를 실제로 쓸 수 있는 형태로 가공하는 과정이다.
router.post('/postsCreate', upload.array('files', 5), async (req, res) => {
    // upload.array('files') 미들웨어 실행. multer 미들웨어는 파일 업로드 처리를 위한 미들웨어. 최대개수 5개로
    // - FormData 파싱
    // - 파일들을 임시 저장

    // multer 에러 처리 - 파일 개수 체크
    if (req.files && Array.isArray(req.files) && req.files.length > 5) {
        return res.status(400).json({
            error: '파일 업로드 실패',
            details: '최대 5개 파일만 업로드 가능합니다.'
        });
    }

    //검증1. 정상적으로 데이터가 넘어왔나?
    console.log('req.body:', req.body);
    console.log('req.body 타입:', typeof req.body);
    console.log('req.body.keys:', Object.keys(req.body));
    console.log('req.files:', req.files);
    console.log('req.headers:', req.headers);
    
    if(!req.body.noticeForm){
        return res.status(400).json({
            error: '입력값 검증 실패',
            details: 'form 데이터가 넘어오지 않음'
        });
    }

    let boardData;
    try {
        //게시글 정보 먼저(formData로 넘어왔기 때문에 반드시 사용하기위해서 풀어붜야함.)
        console.log('noticeForm 파싱 전:', req.body.noticeForm);
        console.log('noticeForm 타입:', typeof req.body.noticeForm);
        console.log('noticeForm 길이:', req.body.noticeForm?.length);
        
        boardData = JSON.parse(req.body.noticeForm);
        console.log('noticeForm 파싱 후:', boardData);

        //게시글 검증 2 게시글 검증은 아래에서 진행(ajv로 검증 진행)
        //넘어가서 구조분해 할당 해서 검증 할것임
        const valid = validateBoardData(boardData);//아까 생성한 스키마 구조에다가 검증할 데이터 boardData 집어넣는거.
        console.log('검증 결과:', valid);
        console.log('검증 에러:', validateBoardData.errors);

        if (!valid) {
            return res.status(400).json({ 
                error: '입력값 검증 실패', 
                details: validateBoardData.errors?.map(err => ({
                    param: err.instancePath || err.schemaPath,
                    msg: err.message || '유효하지 않은 데이터입니다'
                })) || []
            });
        }

        const pool = await db.connect();//락걸기
        try {
            //트랜잭션 처리 시작
            await pool.query('BEGIN');
            
                    //pk는 어떻게 받아오기? 여기도 selectKey가 먹히나?
        const result = await createBoard(boardData as unknown as BoardCreateInput, pool);//먼저 게시글 생성 후 pk 받아오기

            //파일이 있을 경우 파일 저장 로직까지 진행. 없을경우 게시글만 저장
            if(req.files && Array.isArray(req.files) && req.files.length > 0){
                //파일 저장 로직까지 진행
                const files = req.files as Express.Multer.File[];//업로드 된 파일들.
                
                // attachments가 있는지 확인
                if(req.body.attachments){
                    const attachmentsData = JSON.parse(req.body.attachments);

                    const localSaveFiles: localSaveFile[] = [];//로컬 저장 배열

                    //첨부파일 삽입을 위한 반복문 시작.
                    for(let i = 0 ; i < attachmentsData.length; i++){
                        const attachmentData = attachmentsData[i];//세팅1
                        const uploadFile = files[i];//세팅2;

                        //uuid 생성(첨부파일 데이터 저장 전에 uuid 생성)
                        const uuid4 = uuidv4();//세팅2

                        //실제 저장할 파일 경로 설정
                        const localPath = "C:\\Users\\WINITECH\\Desktop\\ts예제 다운로드 파일\\" + uuid4 + "-" + attachmentData.myAttachmentTitle;
                        // 실제 저장할 경로

                        //먼저 로컬에 저장할 파일 형태로 넣는거부터
                        localSaveFiles.push({
                            localPath: localPath,
                            uuid: uuid4,
                            originalName: attachmentData.myAttachmentTitle
                        });

                        //이제 DB에 저장 로직 진행
                        const attachmentDataWithUrl = {
                            ...attachmentData,
                            url: localPath, // 로컬 저장 경로를 url로 설정
                            uuid: uuid4,    // uuid 설정
                            myBoardPk: result.boardPk // 게시글 PK 설정
                        };

                        await insertAttachment(attachmentDataWithUrl, result.boardPk, pool);
                        //저장 완료
                    }

                    //마지막으로 로컬에 저장
                    for(let i = 0; i < localSaveFiles.length; i++){
                        const fileInfo = localSaveFiles[i]; //저장할 실제 파일 정보
                        const uploadFile = files[i]; //실제 파일 정보

                        //multer가 임시로 저장한 파일을 경로로 이동
                        const tempPath = uploadFile.path;//임시경로
                        await fs.promises.copyFile(tempPath, fileInfo.localPath);//실경로와 임시 경로 둘다 저장
                        await fs.promises.unlink(tempPath); // 임시 파일 삭제(복사 완료 후 삭제)

                        console.log(`${fileInfo.originalName} 파일 저장 완료`);
                    }
                }
            }
            
            // 모든 작업 완료 후 트랜잭션 커밋
            await pool.query('COMMIT');
            return res.json(result);
        } catch(error) {
            await pool.query('ROLLBACK');//트랜잭션 롤백(어디서 오류가났든)
            
            // 롤백 시에도 임시 파일들 정리
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files as Express.Multer.File[]) {
                    try {
                        await fs.promises.unlink(file.path);
                        console.log(`임시 파일 삭제 완료: ${file.originalname}`);
                    } catch (unlinkError) {
                        console.error(`임시 파일 삭제 실패: ${file.originalname}`, unlinkError);
                    }
                }
            }
            
            console.error('게시글 작성 실패:', error);
            return res.status(500).json({ error: '서버 오류' });
        } finally {
            pool.release();//락 해제
        }
    } catch (parseError) {
        return res.status(400).json({ 
            error: '입력값 검증 실패', 
            details: [{ param: 'noticeForm', msg: '게시글 데이터 형식이 올바르지 않습니다.' }] 
        });
    }
});

//게시글 상세보기(첨부파일만 조회하면 됨. 게시글 정보는 넘어올 때 그대로 가져왔었음.)
router.post('/postDetail', async (req, res) => {
    const boardPk = req.body.myBoardPk;
    const attachments = await getAttachment(boardPk);
    return res.json(attachments);
})

//파일 다운로드 엔드포인트
router.get('/download/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;//구분할.
        
        // UUID로 첨부파일 정보 조회
        const result = await db.query(
            `SELECT my_attachment_title, my_attachment_url 
             FROM myboard.my_attachment 
             WHERE my_attachment_uuid = $1`,
            [uuid]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        }
        
        const fileInfo = result.rows[0];
        const filePath = fileInfo.my_attachment_url;
        
        // 파일 존재 여부 확인
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '파일이 서버에 존재하지 않습니다.' });
        }
        
        // 파일 다운로드 설정
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.my_attachment_title}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // 파일 스트림으로 전송
        const fileStream = fs.createReadStream(filePath);//파일 읽기 스트림
        fileStream.pipe(res);//파일 읽기 스트림 -> 읽은 데이터를 HTTP 응답으로 자동 전송 -> 브라우저가 파일 받게됨
        //pipe 사용해서조각조각 나눠서 보내줌.(메모리 효율적)
        
        // 스트림 완료 후 함수 종료
        return;
        
    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        return res.status(500).json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
    }
});

export default router; 