import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { db } from './db';
import boardRoutes from './routes/boardRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

db.connect()
    .then(() => console.log('DB연결 성공'))
    .catch((err) => console.error('DB 연결 실패 이유는:', err));

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(boardRoutes);//api 요청 받아낼 라우터 각 라우터 파일에서  express.Router(); 해줬음.
app.use(authRoutes);//api 요청 받아낼 라우터

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

