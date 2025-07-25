import { useNavigate } from "react-router-dom";
import React, {useState} from 'react';//요청 시 입력 상태값 관리
import { loginType } from '../types/login';//로그인 타입
import { userLogin } from "../services/api";

const LoginPage = () => {

    //사용할 타입 생성
    const [form, setForm] = useState<loginType>({
        userId : '',
        userPassword: ''
    });

    const navigate = useNavigate();
    const moveBoasrdList = () => {
        navigate(`/`);
    }

    const moveSignUp = () => {
        navigate('/signUp')
    }

    //회원가입과 똑같이 change 감지해서 form값 변경
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;
        setForm(prev => ({
            ...prev,
            //만약 체크박스라면? 한번 더 검사. check 면 true. user, admin 분리는 뒤에서. 처리
            [name] : type === 'checkbox' ? checked : value
        }));
    };

    //검증 함수
    const validate = () => {
        if(!form.userId) {
            alert('아이디를 입력 해주세요');
            return false;
        }

        if(!form.userPassword){
            alert('비밀번호를 입력 해주세요');
            return false;
        }

        return true;
    };

    //로그인 하기 이벤트라고 봐도 무방. form작동시 진행
    const loginProcess = async ( e: React.FormEvent) => {
        e.preventDefault();
        if(validate()){
                    //form 의 상태값들 가져와서 파라미터로 넘겨주면 됨.
                    //2개 이상이니까 form 배열로 넘겨주기
            const response = await userLogin(form);//이놈으로부터 시작

            if(response.status === 'success'){
                //로그인 성공 - 토큰들은 이미 localStorage에 저장됨
                alert(`로그인에 성공 했습니다. 목록 페이지로 이동합니다.`);
                navigate('/');
            }else{
                //로그인 실패 이유 1, 2 존재
                alert(`로그인에 실패 했습니다. 이유는 ${response.message}`);
            }
        }
    }

    return (
        <div>로그인 페이지 입니다.
        <button style={{
            
        }}
        onClick={moveBoasrdList}
        >
            목록으로 이동
        </button>

        <form onSubmit={loginProcess}>
            <label>
                아이디
            </label>
            <input type="text"
                   name="userId"
                   placeholder="아이디를 입력해주세요"
                   value={form.userId}
                   onChange={handleChange}
            />
            <label>
                비밀번호
            </label>
            <input type="password"
                   name="userPassword"
                   placeholder="비밀번호를 입력해주세요"
                   value={form.userPassword}
                   onChange={handleChange}
            />

            <button type="submit">로그인</button>
            <button
                type="button"
                onClick={moveSignUp}
            >
                회원가입 하기
            </button>
        </form>
        </div>
    )
};

export default LoginPage;