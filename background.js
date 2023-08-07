console.log('Background script loaded');
// importScripts('axios.min.js');
let codeVerifier = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request, 'from sender:', sender);
    if (request.type === 'CODE_VERIFIER') {
        codeVerifier = request.payload;
        console.log('Received codeVerifier:', codeVerifier);
        sendResponse({status: "Received the codeVerifier"});
        chrome.storage.local.set({codeVerifier: codeVerifier}, function() {
         });
        startAuthorizationProcess()
    }
});

async function sha256base64(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to base64
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));

    return hashBase64;
}
    
async function generateCodeChallenge(codeVerifier) {
    // Hash the code verifier
    const hash = sha256base64(codeVerifier);
    
    // Base64-url encode the hash
    let encoded = btoa(hash);
    encoded = encoded.split('=')[0]; // Remove any trailing '='
    encoded = encoded.replace('+', '-'); // 62nd char of encoding
    encoded = encoded.replace('/', '_'); // 63rd char of encoding
    return encoded;
}

async function startAuthorizationProcess() {
    if(!codeVerifier) {
        console.error("codeVerifier is not set");
        return;
    }
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const clientId = 'e2RUzw_g08SfNA_XeckoECYgPu9g0FDefi4wQDbYXNE';
    const redirectUri = encodeURIComponent('https://caiabpkbpfdelfbbhehgoakfbnfgbofj.chromium.app.org/'); 
    const authorizeUrl = `https://www.inaturalist.org/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&code_challenge_method=S256&code_challenge=${codeChallenge}`;
    chrome.tabs.create({ url: authorizeUrl });
}

    async function getAccessTokenWithCodeVerifier(code, codeVerifier) {
            const params = {
            client_id: 'e2RUzw_g08SfNA_XeckoECYgPu9g0FDefi4wQDbYXNE',
            code: code,
            redirect_uri: 'https://caiabpkbpfdelfbbhehgoakfbnfgbofj.chromium.app.org/', // Update this with your redirect_uri
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
        };
                // Define the token URL
        const tokenUrl = 'https://www.inaturalist.org/oauth/token';
    
        console.log("Requesting token from URL:", tokenUrl);
        console.log("Payload:", params);

        try {
            console.log('Getting access token...');
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
    
            // Check the response
            if (!response.ok) {
                const errorText = await response.text();  // Capture the response body as text
                throw new Error(`Response not OK: ${response.status} ${response.statusText}. Body: ${errorText}`);
            };
    
            // Get the access token from the response body
            const { access_token: accessToken } = await response.json();
            console.log('Access token received:', accessToken);
    
            // Return the access token
            return accessToken;
        } catch (error) {
            console.error(`Error getting access token: ${error}`);
            return null;
        }
    }

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        chrome.tabs.get(tabId, (tab) => {
            // console.log('Updated tab URL:', tab.url);

            if (tab.url && tab.url.startsWith('https://caiabpkbpfdelfbbhehgoakfbnfgbofj.chromium.app.org/')) {
                const url = new URL(tab.url);
                const code = url.searchParams.get('code');
                
                if (code) {
                    console.log('Extracted code:', code);
                    // chrome.storage.local.set({code: code}, function() {
                    //  });
                     chrome.storage.local.get(['codeVerifier'], function(result) {
                    });
                    const accessToken = getAccessTokenWithCodeVerifier(code, codeVerifier);
                
                } else {
                    console.log('No code found in the URL.');
                }
            }
        });
    }
});


