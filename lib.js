const $ = function (path) {
    if (path) {
        var objs = document.querySelectorAll(path)
        return objs.length > 1 ? objs : objs.item(0)
    }
    return document;
}

function invertHash(hash) {
    inv = {}
    for (key in hash)
        inv[hash[key]] = key
    return inv
}

function switchTab(tabId) {
    for (const c of $('.tab')) {
        c.style.display = 'none'
    }
    $('.' + tabId).style.display = 'block'
}

function displayError(errorInput, errorMessage) {
    for (const c of $('.tab')) {
        c.style.display = 'none'
    }
    errorInput.closest('.tab').classList.forEach(c => {
        if (c.startsWith('config')) {
            $('#' + c).dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            }))
        }
    })
    errorInput.classList.add('error')
    var status = $('#status')
    if (status.innerHTML == '') {
        errorInput.focus()
    }
    status.innerHTML = errorMessage
}

