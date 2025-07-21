import  express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';


//환경변수 로드. (DB 연결 정보) dotenv 사용해서 외부에 노출 x 난 자유롭게 사용
dotenv.config();

//JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || 'qqqnapppnaopqqqoArfgtodo';//jwt전용 비밀키
const JWT_EXPIRES_IN = '12h';//토큰 유효기간(엑세스? 리프레시? 리포레시 로테이트로 가는거면 아마 리프레시 시간인듯)

//jwt 토큰 생성
const generateToken = (userId: string): string => {
    //한번 sign()을 봐보자. 보내는 아규먼트 3개, 받아내는 매개변수 3
    //첫번쨰 arg는 payload다. 그냥 파라미터 값이라 보면 된다.
    //두번쨰 arg는 secretOrPrivateKey 즉, 비밀키이다(암호화, 복호화 용도)
    //세번째 options? 는 옵셔널. 이름과 함꼐 보면 추ㅡ가 옵션이다. SignOptions로 되어있는데 들어가보자
    // > 토큰에 대한 추가 옵션들이 나열되어있다.
    //   algorithm, keyid, expiresIn, jwtid...등 지금은 만료시간을 보내고있음.
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN});
};

//JWT 토큰 검증
const verifyToken = (token: string): any => {
    try{
        return jwt.verify(token, JWT_SECRET);//토큰 검증. 설정해놓은 암호화 키 값으로 진행. 주는타입은 일단은 any
    } catch(error){
        return null;
    }
};

//리프레시 토큰 생성 후 DB에 저ㅏ장
const generateRefreshToken = (userId: string): string => {
    //access 토큰 만들때와 똑같다. payload, 비밀키, 추가옵션.(만료시간)
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d'});
};

//비밀번호 해싱
const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

//비밀번호 검증
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    //평문과 암호화 값 비교. compare 사용. 일치하면 true. 틀리면 false
    return await bcrypt.compare(password, hashedPassword);
}

// 인증 미들웨어
const authenticateToken = (req: any, res: any, next: any)  => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];//Bearer Token(인증된 사용자. 뒤에 문자열 코드값 때기)
    
    if(!token){
        return res.status(401).json({message: '토큰이 없습니다.'});
    }

    const decoded = verifyToken(token);//유효성 검사
    if(!decoded) {
        return res.status(403).json({message: '유효하지않은 토큰 입니다.'});
    }

    //verifyToken(token) 의 값은? token에 들어있는 복호화된 토큰의 payload이다.
    //즉, userId: 123, role: 'admin', ....이런정보들
    req.user = decoded;//받은 값에 세팅. 세팅값은(유저 정보.)
    next();//다음으로 넘김
};

// Express Request 타입 확장 (user 속성 추가)
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

//db 연결 테스트
db.connect()
    .then(() => {
        console.log('DB연결 성공');
    })
    .catch((err) => {
        console.error('DB 연결 실패 이유는:', err);
    });

const app = express();
const PORT = process.env.PORT || 3002;//env 파일에 PORT 번호 따라감. 없으면 3001

//미들웨어 설정
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));//combined 설정 시 로그가 더 자세히 뜸
app.use(express.json());//넘어오는 json데이터를 req.body로 바로 접근할 수 있게끔
app.use(express.urlencoded({ extended: true }));//HTML form에서 전송된 데이터를 파싱해서 req.body에 넣어줌. extended:true 로 인해서 중첩 객체, 배열도 파싱가능. 왠만하면 true로

// 회원가입 아이디 체크 로직 (password 제거)
app.post('/idCheckProces', async (req, res) => {
    try{
        const userId = req.body.userId;
        const result = await db.query(
            `SELECT 1 FROM myboard.my_user WHERE user_id = $1`,
            [userId]
        );
        const exists = (result.rowCount ? result.rowCount : 0) > 0;
        res.json({ exists });
    }catch (err){
        res.status(500).json({ message: '서버오류'});
    }
});

//회원가입 로직
app.post('/userSignUp', async (req, res) => {
    try {
        //id, password 추출
        const userPassword = req.body.userPassword;
        const userId = req.body.userId;

        //먼저 id 중복 체크
        const idCheck = await db.query(
            `
                SELECT 1
                FROM myboard.my_user
                WHERE user_id = $1
            `,
            [userId]
        );

        const idExists = (idCheck.rowCount? idCheck.rowCount : 0) > 0;
        
        if(idExists){
            //이미 존재하는 아이디
            return res.json({
                status: 'idFail',
                message: '이미 존재하는 아이디입니다.'
            });
        }

        //비밀번호 해싱
        const hashedPassword = await hashPassword(userPassword);//솔트값 사용해서 해싱 성공.

        //새로운 계정 생성
        const result = await db.query(
            `
            INSERT INTO myboard.my_user (user_id, user_password)
                                VALUES ($1, $2)
            `,
            [userId, hashedPassword]
        );
        
        return res.json({
            status: 'success',
            message: '계정 생성에 성공하였습니다.'
        });

    } catch (err) {
        console.log(`회원가입 에러: ${err}`);
        return res.status(500).json({
            status: 'error',
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 로그인 API 추가(성공 시 JWT 토큰 발급)
//인터셉터 과정 쭉 거치고 오면서 토큰 관련 로직과 암호화 로직만 처리하면 됨. 값 세팅은 다 해서 넘어옴
// **핵심** 트랜잭션을 사용하려면 반드시 client를 따로 가져와야함...!>!>>!> 지금 채번 과정에서 Lock 걸고 pk값 가져오기 때문에 저렇게 사용
// 쉽게 말 하면  연결중인(사용중인) 정보 가져와서 다른 사용자들이 사용 못하게 하는거
// > 연결중인 정보(client)가져와서 > 그 트랜잭션이 끝날 떄까지(커밋/롤백 전까지) > 다른 사용자들이 해당 데이터 건드리짐 못하게 Lock
//다만 여러쿼리르 반드시 묶어서 처리할떄는 client + 트랜잭션 구조로 진행해야함. (BEGIN/ COMMIT/ ROLLBACK)
app.post('/loginProccess', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');//시작
        const { userId, userPassword, deviceId } = req.body;//구조분해 할당. 이름으로만 매칭 키 값
        
        //사용자 정보 조회.(먼저 사용자가 있는지부터 체크)
        const resultUser = await client.query(
            `
                SELECT user_id, user_password
                FROM myboard.my_user
                WHERE user_id = $1
            `,
            [userId]
        );

        if (resultUser.rowCount && resultUser.rowCount > 0){//존재하는 사용자
            const user = resultUser.rows[0];//셀렉 데이터
            //userPassword는 form에서 건너온 입력 데이터. user.user_password는 DB에서 셀렉해온 데이터
            const isValidPassword = await comparePassword(userPassword, user.user_password);//compare 사용하여 암호화 pw와 입력 pw 비교
            if(isValidPassword) {//id, pw 일치. 로그인 자격 있어
                //1. Access Token 발급
                const token = generateToken(user.user_id);
                //2. Refresh Token 발급
                const refreshToken = generateRefreshToken(user.user_id);

                // 기존 리프레시 토큰 모두 삭제
                await client.query(
                  `DELETE FROM myboard.user_refresh_token WHERE user_id = $1 AND device_id = $2`,
                  [user.user_id, deviceId]
                );

                //3. ref_token_pk 직접 채번 (동시성 안전, MAX+FOR UPDATE 대신 DESC LIMIT 1 FOR UPDATE)
                //client 해서 연결정보 가져와서 LOCK걸기
                const { rows } = await client.query(
                  `SELECT ref_token_pk FROM myboard.user_refresh_token ORDER BY ref_token_pk DESC LIMIT 1 FOR UPDATE`
                );
                const nextPk = rows.length > 0 ? rows[0].ref_token_pk + 1 : 1;

                //4. Refresh Token DB에 저장 (직접 채번)
                await client.query(
                  `
                    INSERT INTO myboard.user_refresh_token (ref_token_pk, user_id, refresh_token, created_at, is_valid, expired_at, device_id)
                        VALUES ($1, $2, $3, now(), true, now(), $4)
                  `,
                  [nextPk, user.user_id, refreshToken, deviceId]
                );
                await client.query('COMMIT');//LOCK 종료

                return res.json({
                    status: 'success',
                    message: '로그인에 성공 했씁니다.',
                    token: token,
                    refreshToken: refreshToken,
                    userId: user.user_id
                });
                //간단하게 보자면 이렇게 넘어간 데이터는 데부분 LocalStorage 에 들어갈거임
                //token = accessToken인셈, refreshToken은 그냥 리프레시 토큰, userId는 ㄱ냥 넣어줌. 빼도 될듯(치명적인 정보는 아님)
            }else{
                await client.query('ROLLBACK');//여기서도 ROLLBACK 진행 시 LOCK 해제
                return res.json({
                    status: 'fail',
                    message: '아이디 또는 비밀번호가 일치하지 않습니다.'
                });
            }
        }else{
            await client.query('ROLLBACK');
            return res.json({
                status: 'fail',
                message: '아이디 또는 비밀번호가 일치하지 않습니다.'
            });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(`로그인 에러: ${err}`);
        return res.status(500).json({
            status: 'error',
            message: '서버 오류가 발생했습니다.'
        });
    } finally {
        client.release();//연결종료. 리소스 낭비 방지(할당 리소스 해제)
    }
});

//리프레시 토큰 삭제

app.delete('/refreshTokenDelete', async (req, res) => {
  const userId = req.query.userId;
  const refreshToken = req.query.userRefreshToken;
  const deviceId = req.query.deviceId; // 추가된 deviceId 파라미터
  //param으로 넘어왔으니까 query로 받기. body로 받으면안됨

        //쿼리 진행
        const result = await db.query(
            `
            DELETE FROM myboard.user_refresh_token
            WHERE user_id = $1
              AND refresh_token = $2
              AND device_id = $3
            `,
            [userId, refreshToken, deviceId]
        )

  if ((result.rowCount || 0) > 0) {
    return res.json({ status: 'success', message: '삭제 성공' });
  } else {
    return res.json({ status: 'fail', message: '삭제 실패' });
  }
});


//넘어오는 메서드는 get 형식. url에 파라미터 달아서 오는 형식임 ?page=6 즉, req.query.value 형태로 받기
//아래 req.query.page 의 page 타입형태를 보면 string | string[] | undefinde임. 즉, parseInt를 안전하게 할 수 없음. undefinde 혹은 string[]일경우에 안되니까. 그래서 타입 캐스팅 해줘야함
app.get('/posts', async (req, res) => {
    try{
        if(typeof req.

            
            query.page !== undefined){//undefined가 아닐 경우에 진행
            //url로 넘어오는 page 값은 /posts?page=1&page=2  처럼 배열로 들어올 수 있고 아무것도 없는 undefined로도 넘어온다.
            const page = parseInt(req.query.page as string) | 1;// as string으로 타입 캐스팅.  string으로 변환 후에 parseInt로 형변환
            const limit = 10;//한 페이지에 10개
            const offset = (page - 1) * limit;//시작 데이터 구간.

            //메인 쿼리 진행. 토탈 개수랑 rowNum 까지
            const result = await db.query(
                //초기 세팅. 부모가 null 인 최상위 글
                //계층구조 표현하기 위해 pk를 문자열 형태로 변환 시키고 path라는 이름으로 추가
                //UNION ALL 부터 본 쿼리.
                //myboard.myboard 는  myboard 스키마에서 myboard 테이블 참조.
                    `
                    WITH RECURSIVE board_tree AS (
                      SELECT
                        my_board_pk,
                        my_board_title,
                        my_board_author,
                        my_board_content,
                        my_board_create_at,
                        my_board_update_at,
                        my_board_view_count,
                        my_board_parent_pk,
                        1 AS depth,
                        CAST(my_board_pk AS TEXT) AS path
                      FROM myboard.my_board
                      WHERE my_board_parent_pk IS NULL
              
                      UNION ALL
              
                      SELECT
                        c.my_board_pk,
                        c.my_board_title,
                        c.my_board_author,
                        c.my_board_content,
                        c.my_board_create_at,
                        c.my_board_update_at,
                        c.my_board_view_count,
                        c.my_board_parent_pk,
                        p.depth + 1 AS depth,
                        p.path || '>' || c.my_board_pk AS path
                      FROM myboard.my_board c
                      JOIN board_tree p ON c.my_board_parent_pk::int = p.my_board_pk
                    )
                    SELECT
                        my_board_pk AS "myBoardPk",
                        my_board_title AS "myBoardTitle",
                        my_board_content AS "myBoardContent",
                        my_board_author AS "myBoardAuthor",
                        my_board_create_at AS "myBoardCreatedAt",
                        my_board_update_at AS "myBoardUpdateAt",
                        my_board_view_count AS "myBoardViewCount",
                        my_board_parent_pk AS "myBoardParentPk",
                        depth,
                        path,
                        ROW_NUMBER() OVER (ORDER BY path) AS "rowNum"
                    FROM board_tree
                    ORDER BY path
                    LIMIT $1 OFFSET $2
                    `,
                    [limit, offset]
                  );

                  //쿼리 값 잘 넘어오는지 테스트 완료. depth도 잘찍힘

                  //응답값 json(객체)형태로 세팅.
                  res.json({
                    posts: result.rows,//쿼리 결과값 result.rows
                    totalCount: result.rows.length,//셀렉 값 길이 = 토탈 카운트
                    currentPage: page,
                    totalPages: Math.ceil(result.rows.length / limit),//올림처리
                  });
             }
    } catch(err){
        console.log('게시글 목록 조회에 실패 했습니다.', err);
        res.status(500).json({ message: '게시글 목록 조회 실패함'});
    }

});

//토큰 검증 API
app.get('/verify-token', authenticateToken, (req, res)=> {
    //검증 로직. 어떻게 검증?  1. 엑세스 토큰이 만료안됨? 엑세스 토큰으로 비교 후 리프레시, 엑세스 재발급
    // 2.엑세스 토큰 만료? 리프레시 토큰 유효한지 확인 후 엑세스 토큰 리프레시 토큰 제발급
    // 결국 둘 다 리프레시 토큰 삭제는 해야함.(기존 삭제 로직 써야함) 그리고 재생성(이것도 기존로직 써야함)

    //1. 액세스 토큰이 있는 사람. 그냥 하이패스.(프론트에서 다 걸러줌)

    //2. 리프레시 토큰도 검사 해봐야함
    res.json({
        status: 'success',
        message: '토큰이 유효합니다.',
        userId: req.user.userId//인증된 사용자 ID
    });
});

//토큰 확인 후 재발급
app.post('/tokenCheck', async (req, res)=>{
    //먼저 넘어온 값 세팅
    const userRefreshToken = req.body.refreshToken;
    const userId = req.body.userId;
    const deviceId = req.body.deviceId; // 추가된 deviceId 파라미터

    //지금 access 토큰은 갔고. refreshtoken검사할 차례
    //쿼리 실행 (단일쿼리 실행. refreshToken 검사만 하면 됨)
    const result = await db.query(
        `
            SELECT 1
            FROM myboard.user_refresh_token
            WHERE refresh_token = $1
              AND user_id = $2
              AND device_id = $3
        `,
        [userRefreshToken, userId, deviceId]
    )

    //데이터 나온다면? 기존 리프레시 토크 삭제 후 새로운 리프레시 토큰 생성, 액세스 토큰 생성
    if((result.rowCount || 0) > 0){//데이터 존재 할 경우
        // 2. 기존 Refresh Token 삭제 (로테이트)
        await db.query(
            `DELETE FROM myboard.user_refresh_token WHERE refresh_token = $1 AND user_id = $2 AND device_id = $3`,
            [userRefreshToken, userId, deviceId]
        );

        // 3. 새 토큰 발급
        const newAccessToken = generateToken(userId);
        const newRefreshToken = generateRefreshToken(userId);

        // 4. 새 Refresh Token DB 저장 (채번 생략: 자동증가 or 기존 방식)
        await db.query(
            `INSERT INTO myboard.user_refresh_token (user_id, refresh_token, created_at, is_valid, expired_at, device_id)
             VALUES ($1, $2, now(), true, now(), $3)`,
            [userId, newRefreshToken, deviceId]
        );

        // 5. 새 토큰 반환
            return res.json({//그대로 로컬 스토리지에 들어갈거임
                status: 'success',
                newAccessToken,
                newRefreshToken
            });
         }else{
            // Refresh Token이 유효하지 않음 (로그아웃 처리)
            return res.status(401).json({
                status: 'fail',
                message: '리프레시 토큰이 유효하지 않습니다. 다시 로그인 해주세요.'
            });
         }
});

//보호된 라우트 예시
app.get('/protected-poosts', authenticateToken, async(req, res) => {
    try{
        //인증된 사용자만이 접근 가능
        const userId = req.user.userId;

        //여기 보호된 로직 추가
        res.json({
            status: 'succes',
            message: '보호된 데이터 입니다.',
            userId: userId
        });
    } catch(err) {
        res.status(500).json({message: '서버 오류'});
    }
});

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
})

