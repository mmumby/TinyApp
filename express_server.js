

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');
//set view to ejs
app.set('view engine', 'ejs');
//listening on port 3000
const PORT = process.env.PORT || 3000;

//enable encrypted cookies
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['s3c73t200k13']
}));

///////////////////////////////////////////
////// Databases
//////////////////////////////////////////

// database for short and long URLS
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    id: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    id: "user2RandomID"
  }
};
//database for user information
const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("one", 10)

  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("two", 10)
  }
};


////////////////////////////////////////////////
//////// Global functions & variables
///////////////////////////////////////////////


//function to generate random 6 character string
function generateRandomString() {
  let randomString = "";
  const options = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i ++) {
    randomString += options.charAt(Math.floor(Math.random() * options.length));
  }
  return randomString;
}
//function to return all urls for loged in user
function urlsForUser(id) {
  let userURLS = {};
  for (let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].id === id) {
      userURLS[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLS;
}

//////////////////////////////////////////////
//////// Post requests
/////////////////////////////////////////////

// calls on function to shorten URL and redirects to url_index page
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  if (longURL !== /^https?:\/\//) {
    longURL = `https://${longURL}`;
  }
  const urlObj = {
    longURL: longURL,
    id: req.session.user_id
  };
  const shortLink = generateRandomString();
  urlDatabase[shortLink] = urlObj;
  res.redirect("/urls");
});

//delete URL's using delete button ONLY if user ID's match
app.post("/urls/:id/delete", (req, res) => {
  let cookieID = req.session.user_id;
  if (urlDatabase[req.params.id].id === cookieID){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(400).send('You do not have permission to delete this URL');
    return;
  }
});

// Request to update longURL and redirect back to URL list
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  if (urlDatabase[req.params.id].longURL !== /^https?:\/\//) {
    urlDatabase[req.params.id].longURL = `https://${urlDatabase[req.params.id].longURL}`;
  }
  res.redirect("/urls");
});

//check to see if account already exists, if so login.
app.post("/login", (req, res) => {
  const textPassword = req.body.password;
  const hashed_password = bcrypt.hashSync(textPassword, 10);
  for (let user in userDatabase) {
    let regUser = userDatabase[user];
    if((req.body.email === regUser["email"]) && (bcrypt.compareSync(textPassword, hashed_password))) {
      req.session.user_id = regUser["id"];
      res.redirect("/urls");
      return;
    }
  }
  res.status(403).send('Invalid Input');
  return;
});

//endpoint, after logout button is clicked cookies are cleared and redirects to login page
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const textPassword = req.body.password;
  const hashed_password = bcrypt.hashSync(textPassword, 10);
  //Must enter both email and password to register
  if((req.body.email && hashed_password) === "") {
    res.status(400).send('Invalid submission');
    return;
  }
  // cannot continue if email already exists
  for (let userid in userDatabase) {
    let user = userDatabase[userid];
    if( user["email"] === req.body.email) {
      res.status(400).send('Account already exists using this Email.');
      return;
    }
  }
  const ID = generateRandomString();
  userDatabase[ID] = {
    id: ID,
    email: req.body.email,
    password: hashed_password
  };
  req.session.user_id = ID;
  res.redirect("/urls");
});

/////////////////////////////////////
///// Get requests
////////////////////////////////////

app.get("/", (req, res) => {
  let cookieID = req.session.user_id;
  let templateVars = {user: userDatabase[cookieID]};
  if (userDatabase[cookieID]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// login page
app.get('/login', (req, res) => {
  let cookieID = req.session.user_id;
  let templateVars = {
    user: userDatabase[cookieID],
    password: userDatabase[bcrypt.hashSync("password", 10)]
  };
  res.render("urls_login", templateVars);
});

// shows url input form
app.get("/urls/new", (req, res) => {
  let cookieID = req.session.user_id;
  let templateVars = {
    user: userDatabase[cookieID]
  };
  res.render("urls_new", templateVars);
});
//register endpoint
app.get('/register', (req, res) => {
  res.render("url_register");
});

// checks if shortURL redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL.longURL);
});

app.get("/urls", (req, res) =>{
  let cookieID = req.session.user_id;
  let templateVars = { urls: urlsForUser(cookieID),
    user: userDatabase[cookieID]
  };
  res.render("urls_index", templateVars);
});

//once redirected to this page, the shortURL and longURL are shown in a list.
app.get("/urls/:id", (req, res) => {
  let cookieID = req.session.user_id;
  let templateVars = { shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: userDatabase[cookieID]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
