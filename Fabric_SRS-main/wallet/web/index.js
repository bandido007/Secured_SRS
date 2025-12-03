const express = require('express')
const { json } = require('body-parser');
const layouts = require('express-ejs-layouts')
const session = require('express-session');
const { render } = require('ejs');

const app = express()


app.set('view engine', 'ejs')
app.use(layouts)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: 'wallet',
    resave: false,
    saveUninitialized: true
}))

function authenticate(req, res, next) {
    if (req.session.username) next()
    else res.redirect('/')
}


app.get('/', (req, res) => {
    res.render('index')
})


app.post('/wallet/login', (req, res) => {

    if (req.body.type == 'check') {
        console.log('Check');
        if (req.session.username) res.json({ state: '1' })
        else res.json({ state: '0' })
    }
    else if (req.body.type =='logout') {
        console.log('Logout');
        req.session.destroy()
        res.json({ state: '1'})
    }
    else {
        console.log('Login');
        console.log(req.body);
        req.session.username = req.body.username
        res.json({ url: 'http://127.0.0.1:8080/dash' })
    }
})

app.get('/dash', authenticate, (req, res, next) => {
    res.render('dashboard')
})

app.listen(8080, () => {
    console.log('Server listening at 8080');
})