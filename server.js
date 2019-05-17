const mongoose = require("mongoose");
const credentials = require("./mongo-credentials"); // create it
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");
var ObjectId = require('mongodb').ObjectID;

const API_PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
const router = express.Router();

// this is our MongoDB database
const dbRoute = `mongodb://${credentials['username']}:${credentials['userpassword']}@ds${credentials['ds']}.mlab.com:${credentials['port']}/${credentials['tablename']}`;

// connects our back end code with the database
mongoose.connect(
  dbRoute,
  { useNewUrlParser: true },
  (err) => err ? console.log(err) : console.log('success')
);

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

// this is our get method
// this method fetches all available data in our database
router.get("/getUsers", (req, res) => {
  Data.find({}, null, {sort: {createdAt: -1}}, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this is our update method
// this method overwrites existing data in our database
router.post("/updateUser", (req, res) => {
  const { _id, update } = req.body;

  Data.findOneAndUpdate({ _id: mongoose.Types.ObjectId(_id) }, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our delete method
// this method removes existing data in our database
router.delete("/deleteUser", (req, res) => {
  const { _id } = req.body;

  Data.findOneAndDelete({ _id: mongoose.Types.ObjectId(_id) }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create method
// this method adds new data in our database
router.post("/putUser", (req, res) => {
  let data = new Data();

  const { firstname, lastname, position } = req.body;

  if (!firstname || !lastname) {
    return res.status(400).send("unable to save to database");
  }
  data.firstname = firstname;
  data.lastname = lastname;
  data.position = position;
  data.save()
    .then(item => {
      return res.json({ data: item, success: true });
    })
    .catch(err => {
      res.status(400).send("unable to save to database");
    });
});

// append /api for our http requests
app.use("/api", router);
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build')); 
  app.use('*', express.static('client/build')); // Added this     
}

app.get('*', (req, res) => res.sendFile(path.resolve('client', 'build', 'index.html')));

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));