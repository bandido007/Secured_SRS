/**
 * Div for stage control
 */
let url_div = document.getElementById('url-div')
let id_div = document.getElementById('id-div')
let username_div = document.getElementById('username-div')
let password_div = document.getElementById('password-div')
let connect_div = document.getElementById('connect-div')
let connected_div = document.getElementById('connected-div')

/**
 * Buttons for changing stages
 */
let url_next = document.getElementById('url-next')
let id_next = document.getElementById('id-next')
let username_next = document.getElementById('username-next')
let password_set = document.getElementById('password-set')
let connect = document.getElementById('password-connect')
let newId = document.getElementById('newId')
let disconnect = document.getElementById('disconnect')

/**
 * Inputs for Data
 */
let url = document.getElementById('url')
let id = document.getElementById('id')
let username = document.getElementById('username')
let password = document.getElementById('password')
let password_connect = document.getElementById('passwordConnect')



/**
 * Check if provided json object is empty
 * @param {Json Object} obj 
 * @returns 
 */
function isEmpty(obj) {
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            return false
        }
    }
    return true
}


/**
 * Check which stage user stopped to enter data
 */

url_div.style.display = 'none'
id_div.style.display = 'none'
username_div.style.display = 'none'
password_div.style.display = 'none'
connect_div.style.display = 'none'
connected_div.style.display = 'none'

function checkStage() {
    chrome.storage.sync.get('url', (urlData) => {
        if (isEmpty(urlData)) {
            url_div.style.display = 'block'
            id_div.style.display = 'none'
            username_div.style.display = 'none'
            password_div.style.display = 'none'
        } else {
            chrome.storage.sync.get('id', (idData) => {
                if (isEmpty(idData)) url2id()
                else {
                    chrome.storage.sync.get('username', (usernameData) => {
                        if (isEmpty(usernameData)) id2username()
                        else {
                            chrome.storage.sync.get('passCheck', (check) => {
                                if (isEmpty(check)) username2password()
                                else checkConnectivity()
                            })
                        }
                    })
                }
            })
        }
    })
}


/**
 * Check if logged in
 */

function checkConnectivity() {
    chrome.storage.sync.get('username', ({username}) => {
        if (username) {
            chrome.storage.sync.get('url', ({ url }) => {

                let data = {
                    type: 'check',
                    username
                }
        
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).then(data => {
                    data.json().then((response) => {
        
                        if (response.state == '1') {
                            connected()
                        } else {
                            connect_div.style.display = 'block'
                        }
                    })
        
                })
            })
        } else {
            connect_div.style.display = 'block'
        }
    })
    

}

checkStage()



/**
 * Page Changes
 */
function url2id() {
    // Avoid resetting url to null

    chrome.storage.sync.get('url', (urlData) => {

        if (isEmpty(urlData))
            chrome.storage.sync.set({ url: url.value }, () => {
                id_div.style.display = 'block'
                url_div.style.display = 'none'
            })
        else {
            id_div.style.display = 'block'
            url_div.style.display = 'none'
        }

    })

}

function id2username() {
    chrome.storage.sync.set({ id: id.value }, () => {
        id_div.style.display = 'none'
        username_div.style.display = 'block'
    })
}

function username2password() {
    chrome.storage.sync.set({ username: username.value }, () => {
        username_div.style.display = 'none'
        password_div.style.display = 'block'

    })
}

function password2connect() {
    password_div.style.display = 'none'
    connect_div.style.display = 'block'
}

function connect2connected() {
    connect_div.style.display = 'none'
    connected_div.style.display = 'block'
}

/**
 * Buttons actions
 */
url_next.addEventListener('click', (event) => {
    if (url.value != '') {
        url2id()
    }
})

id_next.addEventListener('click', (event) => {
    id2username()
})

username_next.addEventListener('click', (event) => {
    username2password()
})

password_set.addEventListener('click', (event) => {

    // chrome.storage.sync.get('id', (d)=>{
    //     alert(JSON.stringify(d))
    // })

    if (password.value != '') {
        chrome.storage.sync.get('id', (data) => {
            if (isEmpty(data)) url2id()
            else {
                // Encrypt User id
                let cipher = CryptoJS.AES.encrypt(JSON.stringify(data.id), password.value)
                cipher = cipher.toString()
                chrome.storage.sync.set({ id: cipher }, () => {
                    chrome.storage.sync.set({ passCheck: 'true' })
                    password2connect()
                })
            }
        })
    }
})





/**
 * Connect page
 */

let passText = document.getElementById('passText')
let passInfo = document.getElementById('passInfo')

passText.style.display = 'none'
passEmpty.style.display = 'none'

password_connect.addEventListener('change', (e) => {
    passText.style.display = 'none'
    passEmpty.style.display = 'none'
    passInfo.style.display = 'block'
})



connect.addEventListener('click', (event) => {

    // chrome.storage.sync.clear(() => {
    //     alert('Done')
    // })

    if (password_connect.value != '') {
        chrome.storage.sync.get('id', ({ id }) => {
            let decrypted = CryptoJS.AES.decrypt(id.toString(), password_connect.value)
            try {
                decrypted = decrypted.toString(CryptoJS.enc.Utf8)
                if (decrypted) connect_secDoc(decrypted)
                else {
                    passText.style.display = 'block'
                    passInfo.style.display = 'none'
                    passEmpty.style.display = 'none'
                }
            } catch (e) {
                passText.style.display = 'block'
                passEmpty.style.display = 'none'
                passInfo.style.display = 'none'
            }
        })
    } else {
        passText.style.display = 'none'
        passEmpty.style.display = 'block'
        passInfo.style.display = 'none'
    }


    // chrome.storage.sync.get('url', (data) => {
    //     var values
    //     values = JSON.stringify(data)

    //     chrome.storage.sync.get('id', (data) => {
    //         values += '\n' + JSON.stringify(data)

    //         chrome.storage.sync.get('username', (data) => {

    //             values += '\n' + JSON.stringify(data)
    //             alert(values)
    //         })
    //     })
    // })

})


/**
 * Connection process to Sec Doc
 */


function connect_secDoc(userId) {

    // chrome.storage.sync.clear(()=>{
    //     alert('done')
    // })


    chrome.storage.sync.get('url', ({ url }) => {
        chrome.storage.sync.get('username', ({ username }) => {

            let data = {
                username,
                id: JSON.parse(userId),
                type: 'connect'
            }

            fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(data => {
                data.json().then((response) => {

                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        chrome.tabs.update(tabs[0].id, { url: response.url })
                        connected()
                    })
                })
            })
        })
    })
}


let usernameConnected = document.getElementById('username-connected')
let urlConnected = document.getElementById('url-connected')

function connected() {

    url_div.style.display = 'none'
    id_div.style.display = 'none'
    username_div.style.display = 'none'
    password_div.style.display = 'none'
    connect_div.style.display = 'none'
    connected_div.style.display = 'block'

    chrome.storage.sync.get('url', ({ url }) => {
        urlConnected.innerHTML = url
        chrome.storage.sync.get('username', ({ username }) => {
            usernameConnected.innerHTML = username
        })
    })
}

disconnect.addEventListener('click', (e)=>{

    connected_div.style.display = 'none'

    chrome.storage.sync.get('username', ({username}) => {
        if (username) {
            chrome.storage.sync.get('url', ({url})=>{
                let data = {
                    type: 'logout',
                    username
                }
            
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).then(data => {
                    data.json().then((response) => {
                        checkStage()
                    })
            
                })
            })
        }
    })
})

newId.addEventListener('click', (e) => {
    chrome.storage.sync.clear(() => {
        url_div.style.display = 'none'
        id_div.style.display = 'none'
        username_div.style.display = 'none'
        password_div.style.display = 'none'
        connect_div.style.display = 'none'
        connected_div.style.display = 'none'
        checkStage()
    })
})


// // chrome.webRequest.onBeforeRequest.addListener(function(details) {
// //     console.log(details);
// //     }, {urls: ["https://www.google.com/*"]}, ["blocking"]);




// let submit = document.getElementById('submit')
// let password = document.getElementById('password')


// submit.addEventListener('click', () => {

//     // if (password.value != '') {

//     // }


//     let cipher = CryptoJS.AES.encrypt('hello', 'password')
//     cipher = cipher.toString()

//     chrome.storage.sync.set({name:cipher}, ()=>{

//     })

//     chrome.storage.sync.get('nam', (data)=>{
//         alert(JSON.stringify(data))
//     })

//     // fetch('http://127.0.0.1:8080/wallet/login', {
//     //     method: 'POST',
//     //     headers: {
//     //         'Accept': 'application/json',
//     //         'Content-Type': 'application/json'
//     //     },
//     //     body: JSON.stringify({ name: 'Lusajo' })
//     // }).then(data => {
//     //     alert(data)
//     // })
// })

// // $(function () {
// //     // $('#')
// // })


// // chrome.storage.sync.get("color", ({ color }) => {
// //     // let btn = document.getElementById("changeColor");
// //     // btn.style.backgroundColor = color

// //     // btn.addEventListener('click', async ()=>{
// //     //     let [tab] = await chrome.tabs.query({active:true, currentWindow: true})

// //     //     chrome.scripting.executeScript({
// //     //         target: {tabId: tab.id},
// //     //         function: changeColor
// //     //     })
// //     // })

// //     // function changeColor() {
// //     //     chrome.storage.sync.get('color', ({color}) => {
// //     //         document.body.style.backgroundColor = color
// //     //     })
// //     // }
// // })


