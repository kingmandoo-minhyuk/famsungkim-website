<script>

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



</script>

