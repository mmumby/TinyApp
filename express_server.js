//store longURL that came in from form URL/new
//generate shortURL using function
//store shortURL in variable


// "use strict";

const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.set("view engine", "ejs");
//default port 8080
const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//function to generate random 6 character string
function generateRandomString() {
  let randomString = "";
  const options = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i ++) {
    randomString += options.charAt(Math.floor(Math.random() * options.length));
  }
  return randomString;
}
// database for short and long URLS
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//database for user information (hardcoded for now)
const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
// shows url input form
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

// calls on function to shorten URL and redirects to url_index page
app.post("/urls", (req, res) => {
  const shortLink = generateRandomString();
  urlDatabase[shortLink] = req.body.longURL;
  // corrects URL to include https:// if not already entered
    if (urlDatabase[shortLink] !== /^https?:\/\//) {
      urlDatabase[shortLink] = `https://${urlDatabase[shortLink]}`;
    }

  //redirect to /url/:id page to show short and Long URLs
  res.redirect(`/urls/${shortLink}`);
});

//delete URL's using delete button
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Post request to update longURL and redirect to /urls
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
    if (urlDatabase[req.params.id] !== /^https?:\/\//) {
      urlDatabase[req.params.id] = `https://${urlDatabase[req.params.id]}`;
    }
  res.redirect("/urls");
});

//check to see if account already exists, if so login.
app.post("/login", (req, res) => {
  for (var user in userDatabase) {
    var regUser = userDatabase[user];
  if((req.body.email === regUser["email"]) && (req.body.password === regUser["password"])) {
    res.cookie("user_id", regUser["id"]);
    res.redirect("/urls");
  } else {
    res.status(403).send('Invalid Input');
    return;
  }
  }
});

//endpoint, after logout button is clicked cookies are cleared and redirects to /urls
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  //Must enter both email and password
  if((req.body.email && req.body.password) === "") {
    res.status(400).send('Invalid submission');
    return;
  }
  // cannot continue if email already exists
  for (var userid in userDatabase) {
    var user = userDatabase[userid]
    if( user["email"] === req.body.email) {
   res.status(400).send('Account already exists using this Email.');
   return;
    }
  }
  const ID = generateRandomString();
  userDatabase[ID] = {
    id: ID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", ID);
  res.redirect("/urls");
});

//register endpoint
app.get('/register', (req, res) => {
  res.render("url_register");
});

// login page
app.get('/login', (req, res) => {
  let templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
})
// checks if shortURL redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.get("/urls", (req, res) =>{
  let templateVars = { urls: urlDatabase,
                       user: userDatabase[req.cookies["user_id"]]
                      };
  res.render("urls_index", templateVars);
});

//once redirected to this page, the shortURL and longURL are shown in a list.
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       lURL: urlDatabase[req.params.id],
                       user: userDatabase[req.cookies["user_id"]]
                     };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
