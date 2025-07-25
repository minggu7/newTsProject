import React from 'react';
import { QuickMenuType } from '../../types/layout';

const quickMenuList: QuickMenuType[] = [
  {
    title: '빠른이동 1',
    url: '/nature',
    imgUrl: '/images/raymond-petrik-o0dGoUYKWbE-unsplash.jpg'
  },
  {
    title: '빠른이동 2',
    url: '/board',
    imgUrl: '/images/patrick-federi-B5LEuOMhvg8-unsplash.jpg'
  },
  {
    title: '빠른이동 3',
    url: '/mypage',
    imgUrl: '/images/raymond-petrik-o0dGoUYKWbE-unsplash.jpg'
  }
];

//React.CSSProperties 타입을 명시하면 React가 style 객체의 모든 속성을 올바르게 인식합니다.
//Header.tsx 의 경우 filter, onjectFit, position 같은 속성 사용 안해서 그냥 통과
const cardStyle: React.CSSProperties = {
  position: 'relative',
  width: 120,
  height: 120,
  marginBottom: 24,
  borderRadius: 12,
  overflow: 'hidden',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};

const bgImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'blur(6px) brightness(0.7)',//블러처리
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 1
};

const titleStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 18,
  zIndex: 2,
  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
};

const QuickMenu = () => (
  <aside>
    {quickMenuList.map(item => (
      <div
        key={item.title}
        style={cardStyle}
        onClick={() => window.location.href = item.url}
      >
        <img src={item.imgUrl} alt={item.title} style={bgImgStyle} />
        <div style={titleStyle}>{item.title}</div>
      </div>
    ))}
  </aside>
);

export default QuickMenu; 