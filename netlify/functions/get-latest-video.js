// netlify/functions/get-latest-video.js

// Helper function to parse ISO 8601 duration (e.g., PT1M30S) into seconds
function parseDuration(duration) {
    // Simple regex for HMS, good enough for >60s check
    const regex = /P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?/;
    const parts = duration.match(regex);

    // Check if it matches PT...S format at least, even if 0 seconds
    if (!parts) {
         // Check if it contains Y, M, D, W - these are definitely long
         if (duration.includes('Y') || duration.includes('M') || duration.includes('W') || duration.includes('D')) {
             return 99999; // Consider it long
         }
         console.warn(`[parseDuration] Could not parse duration format: ${duration}`);
         return 0; // Assume 0 if no HMS part found and no YMDW
    }

    const hours = parseInt(parts[1] || 0);
    const minutes = parseInt(parts[2] || 0);
    const seconds = parseFloat(parts[3] || 0);

    // If Y/M/D/W were present, the earlier check would return 99999
     if (duration.includes('Y') || duration.includes('M') || duration.includes('W') || duration.includes('D')) {
          return 99999;
     }

    return (hours * 3600) + (minutes * 60) + seconds;
}

exports.handler = async (event, context) => {
    // ★★★ Get API Key from Environment Variable ★★★
    const API_KEY = process.env.YOUTUBE_API_KEY;
    // ★★★ Your Channel ID ★★★
    const CHANNEL_ID = 'UClJrRTHSt2vjrDaipO9TD1Q';
    // How many recent videos to check to find a long-form one
    const MAX_RESULTS_TO_CHECK = 15;
    // Minimum duration in seconds for a video *not* to be counted as a Short
    const MIN_DURATION_SECONDS = 61; // Videos >= 61 seconds are kept

    // Check if API Key is configured
    if (!API_KEY) {
        console.error("FATAL: YouTube API Key (YOUTUBE_API_KEY) is not defined in Netlify environment variables.");
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Server configuration error: YouTube API Key is missing.' }),
        };
    }

    // YouTube Data API v3 URLs
const SEARCH_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${MAX_RESULTS_TO_CHECK}&order=date&type=video&key=${API_KEY}`;
const VIDEOS_API_BASE_URL = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=${API_KEY}&id=`;

    try {
        // 1. Search for recent videos from the channel
        console.log(`[get-latest-video] Searching for recent videos for channel: ${CHANNEL_ID}`);
        let searchResponse = await fetch(SEARCH_URL);

        if (!searchResponse.ok) {
             const errorBody = await searchResponse.text();
             console.error(`[get-latest-video] Youtube API Error: ${searchResponse.status} ${searchResponse.statusText}`, errorBody);
             throw new Error(`Youtube API failed with status ${searchResponse.status}`);
        }
        let searchData = await searchResponse.json();
        console.log(`[get-latest-video] Found ${searchData.items ? searchData.items.length : 0} potential videos.`);

        if (!searchData.items || searchData.items.length === 0) {
            throw new Error('No recent videos found via YouTube API.');
        }

        // 2. Iterate through search results to find the first video longer than MIN_DURATION_SECONDS
        for (const item of searchData.items) {
            const videoId = item.id?.videoId; // Use optional chaining
            if (!videoId) {
                console.log("[get-latest-video] Skipping item with no videoId:", item);
                continue;
            }

            console.log(`[get-latest-video] Checking details for video ID: ${videoId}`);
            let videoDetailsResponse = await fetch(`${VIDEOS_API_BASE_URL}${videoId}`);

            if (!videoDetailsResponse.ok) {
                // Log error but continue checking next video
                console.warn(`[get-latest-video] Could not fetch details for video ${videoId}. Status: ${videoDetailsResponse.status}. Skipping.`);
                continue;
            }
            let videoDetailsData = await videoDetailsResponse.json();

            // Extract duration if available
            const durationISO = videoDetailsData.items?.[0]?.contentDetails?.duration; // Use optional chaining

            if (durationISO) {
                const durationSeconds = parseDuration(durationISO);
                console.log(`[get-latest-video] Video ${videoId} duration: <span class="math-inline">\{durationISO\} \(\~</span>{durationSeconds} seconds)`);

                // Check if it meets the minimum duration
                if (durationSeconds >= MIN_DURATION_SECONDS) {
                    console.log(`[get-latest-video] Success! Found latest long-form video: ${videoId}`);
                    // Found the first long-form video, return it!
                    return {
                        statusCode: 200,
                        headers: {
                            'Access-Control-Allow-Origin': '*', // Adjust for production if needed
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ videoId: videoId }),
                    };
                } else {
                     console.log(`[get-latest-video] Video ${videoId} is shorter than ${MIN_DURATION_SECONDS}s. Skipping.`);
                }
            } else {
                 console.warn(`[get-latest-video] Duration not found for video ${videoId}. Skipping.`);
            }
        } // End of for loop

        // 3. If loop finishes without finding a suitable video
        console.warn(`[get-latest-video] No video longer than ${MIN_DURATION_SECONDS}s found within the last ${MAX_RESULTS_TO_CHECK} uploads.`);
        throw new Error(`No recent long-form video found within the checked range.`);

    } catch (error) {
        // 4. Catch any errors during the process
        console.error("[get-latest-video] Error processing request:", error);
        return {
            statusCode: 500,
             headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            // Provide a more generic error message to the client for security
            body: JSON.stringify({ error: 'Failed to retrieve latest video.' }),
        };
    }
};