    const langButtons = document.querySelectorAll('.lang-switcher button');

    let currentLang = localStorage.getItem('preferredLang') || 'en'; // 저장된 언어 또는 기본값(en)

    let translations = {}; // 로드된 번역 데이터 저장



    // 번역 데이터 로드 함수

    async function loadTranslations(lang) {

        try {

            const response = await fetch(`/locales/${lang}.json`); // 해당 언어 JSON 파일 요청

            if (!response.ok) {

                throw new Error(`Failed to load ${lang}.json`);

            }

            translations = await response.json(); // JSON 데이터 저장

            applyTranslations(); // 번역 적용 함수 호출

            updateLangButtons(lang); // 버튼 활성 상태 업데이트

            localStorage.setItem('preferredLang', lang); // 선택 언어 저장

        } catch (error) {

            console.error('Error loading translation:', error);

            // 기본 언어(en)로 재시도 또는 오류 메시지 표시

            if (lang !== 'en') loadTranslations('en');

        }

    }



    // 페이지 텍스트에 번역 적용 함수

    function applyTranslations() {

        document.querySelectorAll('[data-lang-key]').forEach(element => {

            const key = element.getAttribute('data-lang-key');

            // HTML 태그를 포함해야 하는 경우 innerHTML 사용 (주의 필요)

            if (key === 'hero_title') { // 예시: <br> 태그 포함

                element.innerHTML = translations[key] || element.dataset.defaultText || '';

            } else {

                // dataset.defaultText 는 초기 로딩 시 원본 텍스트 저장용 (선택적)

                element.textContent = translations[key] || element.dataset.defaultText || '';

            }



            // 버튼 텍스트 등 속성값 변경이 필요하면 여기서 추가 처리

             if (element.id === 'load-more-btn' && !element.disabled) {

                 element.textContent = translations[key];

             } else if (element.id === 'load-more-btn' && element.disabled) {

                 element.textContent = translations['all_shown_btn']; // 모두 표시됨 키 사용

             }

        });

        // 페이지 제목 등 추가적인 부분 업데이트

        if (translations['site_title']) {

             document.title = translations['site_title'];

        }

    }



    // 언어 버튼 활성 상태 업데이트 함수

    function updateLangButtons(activeLang) {

         langButtons.forEach(button => {

             if (button.getAttribute('data-lang') === activeLang) {

                 button.classList.add('active-lang');

             } else {

                 button.classList.remove('active-lang');

             }

         });

    }



    // 언어 버튼 클릭 이벤트 설정

    langButtons.forEach(button => {

        // 초기 텍스트 저장 (선택적)

        const key = button.getAttribute('data-lang-key');

        if (key) button.dataset.defaultText = button.textContent;



        button.addEventListener('click', () => {

            const lang = button.getAttribute('data-lang');

            loadTranslations(lang);

        });

    });



   // 초기 페이지 로드 시 언어 적용

   // 페이지 로딩 시 모든 요소의 초기 텍스트를 저장 (선택적이지만 권장)

   document.querySelectorAll('[data-lang-key]').forEach(element => {

        element.dataset.defaultText = element.innerHTML; // 또는 textContent

   });

   loadTranslations(currentLang); // 저장된 언어 또는 기본 언어 로드



// 이 코드를 language.js 파일 또는 멤버 페이지 script 태그 안에 추가
// 다른 DOMContentLoaded 리스너 안에 넣거나, 새로 만듭니다.

document.addEventListener('DOMContentLoaded', () => { // 페이지 로드 완료 후 실행

    // --- 기존 언어 전환 코드 시작 (예시 - language.js에 이미 있다면 이 부분은 생략) ---
    /*
    const langButtons = document.querySelectorAll('.lang-switcher button');
    let currentLang = localStorage.getItem('preferredLang') || 'en';
    let translations = {};
    // ... loadTranslations, applyTranslations, updateLangButtons 함수 ...
    // ... 언어 버튼 클릭 이벤트 리스너 ...
    // ... 초기 언어 로드 ...
    */
    // --- 기존 언어 전환 코드 끝 ---


    // --- ▼▼▼ 멤버 이름 드롭다운 로직 ▼▼▼ ---
    const memberToggleBtn = document.getElementById('member-toggle-btn');
    const memberDropdownList = document.getElementById('member-list');

    // 해당 버튼과 목록이 현재 페이지에 있는지 확인
    if (memberToggleBtn && memberDropdownList) {

        // 버튼 클릭 시 드롭다운 토글
        memberToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // body 클릭 리스너에 영향 주지 않도록
            const isHidden = memberDropdownList.hidden;
            memberDropdownList.hidden = !isHidden; // hidden 속성 토글
            memberToggleBtn.setAttribute('aria-expanded', !isHidden); // ARIA 상태 업데이트
        });

        // 드롭다운 외부 영역 클릭 시 드롭다운 닫기
        document.addEventListener('click', (event) => {
            if (!memberDropdownList.hidden && // 드롭다운이 열려 있고
                !memberToggleBtn.contains(event.target) && // 클릭한 곳이 버튼이 아니고
                !memberDropdownList.contains(event.target)) // 클릭한 곳이 드롭다운 목록도 아니면
            {
                memberDropdownList.hidden = true; // 드롭다운 숨김
                memberToggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Escape 키 누르면 드롭다운 닫기
        document.addEventListener('keydown', (event) => {
             if (event.key === 'Escape' && !memberDropdownList.hidden) {
                 memberDropdownList.hidden = true;
                 memberToggleBtn.setAttribute('aria-expanded', 'false');
             }
        });

         // 드롭다운 메뉴 안의 링크 클릭 시 드롭다운 닫기 (선택 사항)
         memberDropdownList.addEventListener('click', (event) => {
             if (event.target.tagName === 'A') {
                 memberDropdownList.hidden = true;
                 memberToggleBtn.setAttribute('aria-expanded', 'false');
             }
         });
    }
    // --- ▲▲▲ 멤버 이름 드롭다운 로직 끝 ▲▲▲ ---


    // --- AOS 초기화 (member 페이지에도 AOS 사용 시) ---
    if (typeof AOS !== 'undefined') { // AOS 라이브러리가 로드되었는지 확인
       AOS.init({ once: true, duration: 600 });
    }

}); // DOMContentLoaded 끝

