import {Pool} from 'pg';//포스트그레하고 연결하기 위한 커넥션 풀 가져오는 코드(그냥 연결, 연결상태 유지)
import dotenv from 'dotenv';//외부에 숨길 정보 설정하기위한

dotenv.config();//env 값 그대로 사용 가능. (키=값)

console.log('DB_PORT:', process.env.DB_PORT); // 이 줄 추가

export const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});