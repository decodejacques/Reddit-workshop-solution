let express = require("express")
let app = express()
let multer = require("multer")
let upload = multer({
  dest: __dirname + '/uploads/'
})
let cookieParser = require('cookie-parser')
app.use('/images', express.static(__dirname + '/uploads'))
app.use(cookieParser());
let threads = []
let passwordsAssoc = {}
let sessions = {}
let usernameColor = {}

let h = (element, children) => {
  return '<' + element + '>' + children.join('\n') + '</' + element.split(' ').shift() + '>'
}
let makePage = username => {
  let threadElements = threads.map(post => {
    let imgElement = ""
    if (post.imgPath) {
      imgElement = '<img height="100px" src="' + post.imgPath + '"/>'
    }
    let postsByUser = threads.filter(thread => { return thread.user === username })
    let numPosts = postsByUser.length
    let style = '"color: black"'
    if (usernameColor[username] !== undefined) {
      style = '"color: ' + usernameColor[username] + '"'
    }
    let posterSection = h('span style=' + style, [post.user + '(' + numPosts + ')'])
    return '<div>' + imgElement + '<h2>' + post.desc + '</h2><h4> posted by ' + posterSection + '</h4></div>'
  })
  return h('html', [
    h('body', [
      h('h1', ['your username is ' + username]),
      h('div', threadElements),
      h('form action="/thread" method="POST" enctype="multipart/form-data"', [
        h('input type="file" name="thread-img"', []),
        h('input type="text" name="description"', []),
        h('input type="submit"', [])]),
      h('h3', ['Change your name']),
      h('form action="/change-username" method="POST" enctype="multipart/form-data"', [
        h('input type="text" name="new-username"', []),
        h('input type="submit"', [])]),
      h('h3', ['Set username color']),
      h('form action="/set-color" method="POST" enctype="multipart/form-data"', [
        h('input type="text" name="text-color"', []),
        h('input type="submit"', [])])
    ])])
}
app.post("/thread", upload.single('thread-img'), (req, res) => {
  console.log("creating a new thread", req.body)
  let file = req.file
  console.log("the file", file)
  let imagePath = undefined
  if (file !== undefined) {
    imagePath = '/images/' + file.filename
  }
  let sessionId = req.cookies.sid
  let username = sessions[sessionId]
  if (username === undefined) {
    res.send("Stop you hacker!")
    return
  }
  threads.push({
    user: username,
    desc: req.body.description,
    imgPath: imagePath
  })
  res.send(makePage(username))
})

app.post("/set-color", upload.none(), (req, res) => {
  console.log("Changing user's color", req.body)
  let sessionId = req.cookies.sid
  let username = sessions[sessionId]
  usernameColor[username] = req.body["text-color"]
  res.send(makePage(username))
})


app.post("/change-username", upload.none(), (req, res) => {
  console.log("Changing user's name", req.body)
  let sessionId = req.cookies.sid
  let username = sessions[sessionId]

  let newUsername = req.body["new-username"]
  passwordsAssoc[newUsername] = passwordsAssoc[username]
  passwordsAssoc[username] = undefined
  let allSessionIds = Object.keys(sessions)
  allSessionIds.forEach(sessionId => {
    let usernameOfSesssion = sessions[sessionId]
    if (usernameOfSesssion === username) {
      sessions[sessionId] = newUsername
    }
  })

  threads.forEach(post => {
    if (post.user === username) {
      post.user = newUsername
    }
  })

  res.send(makePage(newUsername))
})

app.post("/login", upload.none(), (req, res) => {
  console.log("request to /login", req.body)
  if (passwordsAssoc[req.body.username] !== req.body.password) {
    res.send("<html><body> invalid username or password </body></html>")
    return
  }
  let sessionId = '' + Math.floor(Math.random() * 1000000)
  sessions[sessionId] = req.body.username
  res.cookie('sid', sessionId);
  res.send(makePage(req.body.username))
})
app.post("/signup", upload.none(), (req, res) => {
  console.log("request to /signup", req.body)
  if (passwordsAssoc[req.body.username] !== undefined) {
    res.send("Stop you hacker!")
    return
  }
  passwordsAssoc[req.body.username] = req.body.password
  res.send("<html><body> signup successful </body></html>")
})
app.get("/", (req, res) => {
  let sessionId = req.cookies.sid
  let username = sessions[sessionId]
  if (username !== undefined) {
    res.send(makePage(username))
    return
  }
  res.sendFile(__dirname + "/public/index.html")
})
app.listen(4000, () => {
  console.log("server started")
}) 