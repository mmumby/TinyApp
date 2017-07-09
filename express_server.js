

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');
//set view to ejs
app.set('view engine', 'ejs');
//listening on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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

//check to see if account already exists, if so login, else redirect.
app.post("/login", (req, res) => {
  const textPassword = req.body.password;
  const hashed_password = bcrypt.hashSync(textPassword, 10);
  let cookieID = req.session.user_id;
  let templateVars = { urls: urlsForUser(cookieID),
    user: userDatabase[cookieID]
  };
  for (let user in userDatabase) {
    let regUser = userDatabase[user];
    if((req.body.email === regUser["email"]) && (bcrypt.compareSync(textPassword, regUser["password"]))) {
      req.session.user_id = regUser["id"];
      res.redirect("/urls");
      return;
    }
  }
  res.status(403).render("error403", templateVars);
  return;
});
//endpoint, after logout button is clicked cookies are cleared and redirects to login page
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

//hash password
app.post("/register", (req, res) => {
  const textPassword = req.body.password;
  const hashed_password = bcrypt.hashSync(textPassword, 10);

  let cookieID = req.session.user_id;
  let templateVars = { user: userDatabase[cookieID],
    urls: urlsForUser(cookieID)
  };
  //Must enter both email and password to register
  if((req.body.email && textPassword) === "") {
    res.status(400).render("error_400", templateVars);
    return;
  }
  // cannot continue if email already exists
  for (let userid in userDatabase) {
    let user = userDatabase[userid];
    if( user["email"] === req.body.email) {
      res.status(400).render("error400", templateVars);
      return;
    }
  }
  //generate random ID
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

//redirect to /urls page
app.get("/", (req, res) => {
  let cookieID = req.session.user_id;
  let templateVars = {user: userDatabase[cookieID]};
  if (userDatabase[cookieID]) {
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
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
  let cookieID = req.session.user_id;
  let templateVars = {
    user: userDatabase[cookieID],
    password: userDatabase[bcrypt.hashSync("password", 10)]
  };
  res.render("url_register", templateVars);
});

//only show loged in users URLs
app.get("/urls", (req, res) =>{
  let cookieID = req.session.user_id;
  let templateVars = { urls: urlsForUser(cookieID),
    user: userDatabase[cookieID]
  };
  if(userDatabase[cookieID]) {
    res.status(200).render("urls_index", templateVars);
  } else {
    res.status(401).render("error401", templateVars);
  }
});

// checks if shortURL redirects to longURL
//if invalid address is entered redirected to error message
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  let cookieID = req.session.user_id;
  let templateVars = { user: userDatabase[cookieID],
    urls: urlsForUser(cookieID)
  };
  if(!urlDatabase[req.params.shortURL]) {
    res.status(404).render("error404", templateVars);
  } else if (urlDatabase[req.params.shortURL]) {
    res.redirect(longURL.longURL);
  }
});

app.get("/urls/:id", (req, res) => {
  let cookieID = req.session.user_id;
  if(urlDatabase[req.params.id]) {
    let templateVars = { shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: userDatabase[cookieID],
      urls: urlsForUser(cookieID)
    };
    res.render("urls_show", templateVars);
  }
});
