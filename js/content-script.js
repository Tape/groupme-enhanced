(function (document, angular) {

    // Exit out if Angular wasn't found. God knows why this would happen though.
    if (!angular) return;

    // This is the base scope we will be referencing. It stores all of the chat windows.
    var $baseScope = angular.element(document.body).scope();
    var currentUserId;
    var chatUpdates = {};

    /**
     * Determine if an object doesn't have any properties.
     *
     * @param {object} obj
     * @returns {boolean}
     */
    function isEmpty(obj) {
        for (var key in obj) return false;
        return true;
    }

    /**
     * Generate the current timestamp in seconds.
     *
     * @returns {number}
     */
    function timestamp() {
        return Math.round(Date.now() / 1000);
    }

    /**
     * Dispatch a new custom event to the gme-message event.
     *
     * @param {object} details An object of properties to send through the event.
     */
    function dispatchEvent(details) {
        document.dispatchEvent(new CustomEvent('gme-message', {detail: details}));
    }

    /**
     * Find all messages in a given chat that are new.
     *
     * @param chat The chat to search for new messages.
     * @returns {Array.<T>} An array of new messages with the current user's messages filtered out.
     */
    function findNewMessages(chat) {
        var length = chat.displayedMessages.length;
        var i = length;
        var timestamp = chatUpdates[chat.id] || chat.displayedMessages[length - 1].created_at;

        while (i > 0) {
            var message = chat.displayedMessages[i - 1];
            if (message.created_at <= timestamp) {
                break;
            }
            i--;
        }

        // There's a very odd case where the created_at field is not present when you make the first message after a
        // page refresh. For that we want to generate the current timestamp so when another set of messages come in
        // there will at least be a base to compare against.
        chatUpdates[chat.id] = chat.displayedMessages[length - 1].created_at || timestamp();
        return chat.displayedMessages.slice(i).filter(function (message) {
            return message.user_id != currentUserId;
        });
    }

    /**
     * Refresh our listing of the chats and find all new messages within them.
     *
     * @param chats The chats to refresh.
     * @returns {object} An object containing new updates to the currently open chats.
     */
    function refreshChats(chats) {
        var updates = {};
        chats.forEach(function (chat) {
            if (chat.displayedMessages) {
                var newMessages = findNewMessages(chat);
                if (newMessages.length) {
                    updates.newMessages = (updates.newMessages || []).concat(newMessages);
                }
            }
        });
        return updates;
    }

    $baseScope.$watch('currentUser.id', function (id) {
        currentUserId = id;
    });

    // By doing $watch(prop, callback, true) we listen deeply on the underlying structure of the object. This is
    // needed to scan the messages underneath for any new results. If we end up finding new results, then the idea is to
    // send it back to the extension script via a custom event and embed an audio clip into the page to play a sound.
    $baseScope.$watch('chats', function (chats) {
        var chatsUpdated = refreshChats(chats);
        if (!isEmpty(chatsUpdated)) dispatchEvent(chatsUpdated);
    }, true);

})(window.document, window.angular);
