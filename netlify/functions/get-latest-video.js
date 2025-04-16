// netlify/functions/get-latest-video.js

// XML 파서 라이브러리 가져오기
const { XMLParser } = require("fast-xml-parser");

// Netlify 함수의 기본 핸들러
exports.handler = async (event, context) => {
    // 가져올 유튜브 채널 RSS 피드 주소 (@famsungkim 핸들 사용)
    const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UClJrRTHSt2vjrDaipO9TD1Q';
    let videoId = null; // 비디오 ID 저장 변수

    try {
        // 1. RSS 피드 가져오기
        console.log(`Workspaceing RSS feed from: ${RSS_URL}`);
        // Netlify 함수 환경에서는 node-fetch 없이 바로 fetch 사용 가능
        const response = await fetch(RSS_URL);

        // 응답 상태 확인
        if (!response.ok) {
            console.error(`Failed to fetch RSS feed. Status: ${response.status}, StatusText: ${response.statusText}`);
            const errorBody = await response.text(); // 오류 응답 내용 확인
            console.error("Error response body:", errorBody);
            throw new Error(`Failed to fetch RSS feed: ${response.statusText} (Status: ${response.status})`);
        }

        // XML 텍스트 데이터 읽기
        const xmlData = await response.text();
        console.log("Successfully fetched RSS feed.");

        // 2. XML 파싱하기
        const parserOptions = {
            ignoreAttributes: false, // 속성 무시 안 함
            attributeNamePrefix : "", // 속성 접두사 사용 안 함
            parseAttributeValue : true, // 속성 값 파싱
            allowBooleanAttributes: true,
            trimValues: true,
            ignoreDeclaration: true,
        };
        const parser = new XMLParser(parserOptions);
        const feedObject = parser.parse(xmlData);
        console.log("Attempting to parse XML...");

        // 3. 최신 비디오 ID 추출하기 (피드 구조 확인 필요)
        if (feedObject && feedObject.feed && feedObject.feed.entry) {
            const entries = Array.isArray(feedObject.feed.entry) ? feedObject.feed.entry : [feedObject.feed.entry];
            if (entries.length > 0) {
                // 가장 첫 번째 항목(최신)에서 비디오 ID 찾기
                if (entries[0]['yt:videoId']) {
                    videoId = entries[0]['yt:videoId'];
                } else if (entries[0].id && typeof entries[0].id === 'string' && entries[0].id.includes('yt:video:')) {
                    // yt:videoId 가 없는 경우 id 에서 추출 시도 (예: yt:video:VIDEO_ID)
                    videoId = entries[0].id.split(':').pop();
                }
                console.log(`Found video ID: ${videoId}`);
            } else {
                 console.warn("No <entry> found in the feed.");
            }
        } else {
            console.warn("Feed structure unexpected. Could not find feed.entry.");
            // console.log("Parsed Feed Object for debugging:", JSON.stringify(feedObject, null, 2)); // 필요시 구조 확인용
        }

        if (!videoId) {
             throw new Error('Could not extract video ID from RSS feed.');
        }

        // 4. 성공 응답 반환 (JSON 형식)
        console.log("Returning successful response with videoId:", videoId);
        return {
            statusCode: 200,
            headers: {
                // 중요: 실제 서비스에서는 Netlify 사이트 주소만 허용하는 것이 더 안전합니다.
                'Access-Control-Allow-Origin': '*', // 지금은 모든 도메인에서의 요청 허용
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoId: videoId }), // JSON 형태로 videoId 전달
        };

    } catch (error) {
        // 5. 오류 발생 시 오류 응답 반환
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
             headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: error.message || 'Failed to process request' }),
        };
    }
};