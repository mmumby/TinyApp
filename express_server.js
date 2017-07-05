//store longURL that came in from form URL/new
//generate shortURL using function
//store shortURL in variable


"use strict";

const express = require("express");
const app = express();
app.set("view engine", "ejs")
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


//function to generate random 6 character string
function generateRandomString() {
  let randomString = "";
  const options = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i ++)
    randomString += options.charAt(Math.floor(Math.random() * options.length));;
  return randomString;
}
// database for short and long URLS
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",

};

// shows url input form
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// calls on function to shorten URL and redirects to url_index page
app.post("/urls", (req, res) => {
  const shortLink = generateRandomString();
   urlDatabase[shortLink] = req.body.longURL;
   const retest = /^https?:\/\//;
// corrects URL to include https:// if not already entered
  if (urlDatabase[shortLink] !== /^https?:\/\//); {
     urlDatabase[shortLink] = `https://${urlDatabase[shortLink]}`
  };
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
res.redirect("/urls");
});



// checks if shortURL redirects to longURL
app.get("/u/:shortURL", (req, res) => {
   let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls", (req, res) =>{
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
//once redirected to this page, the shortURL and longURL are shown in a list.
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, lURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
