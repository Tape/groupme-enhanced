// We need to inject the content script into the page so we can get access to GroupMe's Angular code.
var script = document.createElement('script');
script.src = chrome.extension.getURL('js/content-script.js');
document.head.appendChild(script);

/**
 * Create a new DOM element with the given type name and attributes.
 *
 * @param type The type name of the node.
 * @param attributes The attributes to set on the node.
 * @returns {Element}
 */
function createNode(type, attributes) {
    var node = document.createElement(type);
    for (var attr in attributes) {
        node.setAttribute(attr, attributes[attr]);
    }
    return node;
}

/**
 * Creates an audio tag and injects it into the page to play it. Automatically removes the node from the DOM afterwards.
 */
function playSound() {
    var sound = createNode('audio', {autoplay: 'autoplay'});

    sound.appendChild(createNode('source', {
        src: chrome.extension.getURL('audio/incoming1.ogg'),
        type: 'audio/ogg'
    }));

    sound.addEventListener('ended', function () {
        sound.parentNode.removeChild(sound);
        sound = null;
    });

    document.body.appendChild(sound);
}

// We want to listen for any incoming messages from the injected content script.
document.addEventListener('gme-message', function (e) {
    if (e.detail.newMessages) {
        playSound();
    }
});
