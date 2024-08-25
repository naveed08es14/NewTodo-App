
const express = require('express')
const App = express()

App.get('/', function(req, res){
    res.send(`
    <head>
   <script src="browser.js"></script>
    </head>
  <body>
 <button>Click to alert</button>
  </body>
  <script>
  document.addEventListener("click", function(){
 alert("Thank you for clicking")
})
  </script>
    `)
})

App.listen(3000)
