
let express = require("express")
let { MongoClient, ObjectId } = require("mongodb")
let sanitizeHTML = require("sanitize-html")

let app = express()
let db

app.use(express.static('public'))

 function go() {
    let client = new MongoClient('mongodb+srv://todoAppUser:Oman2020@cluster0.il0szdw.mongodb.net/Todo-app?retryWrites=true&w=majority&appName=Cluster0')

    client.connect()
    db = client.db()
    app.listen(3000)
}

go()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

function passwordProtected(req, res, next) {
    res.set("WWW-Authenticate", 'Basic realm="Simple Todo App"')
    console.log(req.headers.authorization)
    if (req.headers.authorization == "Basic bGVhcm46amF2YXNjcmlwdA==") {
        next()
    } else {
        res.status(401).send("Authentication required")
    }
}

app.use(passwordProtected)

app.get("/", passwordProtected, async function (req, res) {
    const items = await db.collection("items").find().toArray()
    res.send(`<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple To-Do App</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
  </head>
  <body>
  <div class="container">
  <h1 class="display-4 text-center py-1">To-Do App!</h1>
 
  <div class="jumbotron p-3 shadow-sm">
  <form id="create-form" action="/create-item" method="POST">
  <div class="d-flex align-items-center">
  <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
  <button class="btn btn-primary">Add New Item</button>
  </div>
  </form>
  </div>
  
  <ul id="item-list" class="list-group pb-5">
  </ul>
  
  </div>

  <script>
  let items = ${JSON.stringify(items)}
  </script>
  
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script>
  function itemTemplate(item) {
    return <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
  <span class="item-text">${item.text}</span>
  <div>
  <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
  <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
  </div>
  </li>
}

// Initial Page Load Render
let ourHTML = items
    .map(function (item) {
        return itemTemplate(item)
    })
    .join("")
document.getElementById("item-list").insertAdjacentHTML("beforeend", ourHTML)

// Create Feature
let createField = document.getElementById("create-field")

document.getElementById("create-form").addEventListener("submit", function (e) {
    e.preventDefault()
    axios
        .post("/create-item", { text: createField.value })
        .then(function (response) {
            // Create the HTML for a new item
            document.getElementById("item-list").insertAdjacentHTML("beforeend", itemTemplate(response.data))
            createField.value = ""
            createField.focus()
        })
        .catch(function () {
            console.log("Please try again later.")
        })
})

document.addEventListener("click", function (e) {
    // Delete Feature
    if (e.target.classList.contains("delete-me")) {
        if (confirm("Do you really want to delete this item permanently?")) {
            axios
                .post("/delete-item", { id: e.target.getAttribute("data-id") })
                .then(function () {
                    e.target.parentElement.parentElement.remove()
                })
                .catch(function () {
                    console.log("Please try again later.")
                })
        }
    }

    // Update Feature
    if (e.target.classList.contains("edit-me")) {
        let userInput = prompt("Enter your desired new text", e.target.parentElement.parentElement.querySelector(".item-text").innerHTML)
        if (userInput) {
            axios
                .post("/update-item", { text: userInput, id: e.target.getAttribute("data-id") })
                .then(function () {
                    e.target.parentElement.parentElement.querySelector(".item-text").innerHTML = userInput
                })
                .catch(function () {
                    console.log("Please try again later.")
                })
        }
    }
})
  </script>
  </body>
  </html>`)
})

app.post("/create-item", async function (req, res) {
    let safeText = sanitizeHTML(req.body.text, { allowedTags: [], allowedAttributes: {} })
    const info = await db.collection("items").insertOne({ text: safeText })
    res.json({ _id: info.insertedId, text: safeText })
})

app.post("/update-item", async function (req, res) {
    let safeText = sanitizeHTML(req.body.text, { allowedTags: [], allowedAttributes: {} })
    await db.collection("items").findOneAndUpdate({ _id: new ObjectId(req.body.id) }, { $set: { text: safeText } })
    res.send("Success")
})

app.post("/delete-item", async function (req, res) {
    await db.collection("items").deleteOne({ _id: new ObjectId(req.body.id) })
    res.send("Success")
})

