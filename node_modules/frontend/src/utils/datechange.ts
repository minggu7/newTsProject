//날짜를 'YYYY.MM.DD' 로 변경
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0')//2자리 아니면 왼쪽에 0채우기
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`;
}