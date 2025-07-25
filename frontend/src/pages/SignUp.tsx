import { signUpType } from '../types/login';
import React, {useState} from 'react';//요청 시 입력 상태값 관리
import { userIdCheck } from '../services/api';//아이디 중복 체크 api
import { userSignUp } from '../services/api';//유저 회원가입 인서트
import { useNavigate } from 'react-router-dom';

const SignUp = () => {

    const navigate = useNavigate();

    const [form, setForm] = useState<signUpType>({
        userId: '',
        userPassword: '',
        role: 'user'//기본값은 일반유저
    });

    // 입력값 변경 시 바로 setForm 통해서 반영
    // input값이 바뀔 때 마다 자동 동작. 
    // input 태그에서 발생하는 change 이벤트를받음. change 시 작동.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        //name 하고 value(입력값) 값만 받아와서 [name]으로 userId, userPassword 분리
        const {name, value, type, checked} = e.target;
        setForm(prev => ({
            ...prev,
            [name] : type === 'checkbox' ? (checked ? 'admin' : 'user') : value
        }));
    };

    // 검증 함수
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

    //회원가입 버튼 클릭. React.FormEvent 는 form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(validate()) {
            //회원가입 API 호출
            const response = await userSignUp(form);//api 처리 부분에서 userId하고 userPassword만 받게함
            if(response.status === 'success'){
                alert('회원가입에 성공 했습니다. 로그인페이지로 이동 합니다.');
                navigate(`/login`);
            }else{
                alert(`회원가입에 실패 했습니다. 불가능한 이유는 ${response.message}`);
            }

        }
    };

    //아이디 중복 검사
    const idCheck = async() => {
        if(!form.userId) {
            alert('아이디를 먼저 입력해주세요.');
            return;
        }
        
        //현재 form 의 userId값 가져와서 그대로 요청값에 넣기
        const response = await userIdCheck(form.userId);

        if(!response){//중복 체크에서 false. 중복 아님
            alert('사용 가능합니다.');
            // 사용 가능하면 disabled 해제
            const inputElement = document.getElementById('userId') as HTMLInputElement;
            if(inputElement) {
                inputElement.setAttribute('disabled', 'disabled');
            }
        }else{
            alert('아이디 중복입니다.');
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>회원가입 페이지

                <label id="userIdLabel">
                    아이디
                </label>
                <input
                    id="userId"
                    type="text"
                    name="userId"
                    value={form.userId}
                    onChange={handleChange}
                />
                <button
                    onClick={idCheck}
                    type= "button"
                >아이디 중복 검사</button>

                <label>
                    비밀번호
                </label>
                <input
                    type="password"
                    name="userPassword"
                    value={form.userPassword}
                    onChange={handleChange}
                />
                {/* admin이면 체크. 아니면 체크풀기 */}
                <label>
                    관리자로 등록하기
                </label>
                <input
                    type="checkbox"
                    name="role"
                    checked={form.role === 'admin'}
                    onChange={handleChange}
                />

                <button type="submit">
                    회원가입 하기
                </button>
            </div>
        </form>
    );
}

export default SignUp;