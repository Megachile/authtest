console.log('content.js has been loaded');

// content_script.js

function generateRandomString() {
    var array = new Uint32Array(28);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

const codeVerifier = generateRandomString();
console.log(codeVerifier)
chrome.runtime.sendMessage({type: "CODE_VERIFIER", payload: codeVerifier}, (response) => {
    if (chrome.runtime.lastError) {
        console.log('Error in sending message:', chrome.runtime.lastError);
    } else {
        console.log('Message sent, response:', response);
    }
});
