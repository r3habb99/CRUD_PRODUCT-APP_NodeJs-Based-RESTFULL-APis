//libraries require for this
const express = require("express");
require("./db/config");

//for authentication
const Jwt = require("jsonwebtoken");
const jwtKey = "amazon";

//Model Imports
const User = require("./model/User");
const Product = require("./model/Product");

//when you hit api from browser we face cors issue to resolve this we have to follow this step
const cors = require("cors");

//Assign express with app
const app = express();

//Middlewares
app.use(express.json());
app.use(cors()); //use cors as middleware to solve that issue

//routes for our app
app.get("/", (req, res) => {
  res.send("Api is working");
});

//Api logic for user sign up and login
app.post("/signup", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  //to hide password when sending response from server use this
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "1h" }, (err, token) => {
    if (err) {
      res.send({
        result: "Something went wrong, try after sometime",
      });
    }
    res.send({ result, auth: token });
  });
});

app.post("/login", async (req, res) => {
  //to check condition of email and password for login
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "1h" }, (err, token) => {
        if (err) {
          res.send({
            result: "Something went wrong, try after sometime",
          });
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send("No User Found");
    }
  } else {
    res.send("Fields are empty");
  }
});

//api logic for add product collection
app.post("/add-product", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save([]);
  res.send(result);
});

//api to get all products record from database
app.get("/products", verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({
      result: "No Products Found",
    });
  }
});

//api to delete product record
app.delete("/product/:id", verifyToken, async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

//api to get single data records from product
app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({
      result: "No Record Found",
    });
  }
});

//api for updating records in collection with new
app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

//api to search product by keyword
app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

//function for verifying authentication token in header and used as a middlewares in routes
function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "Please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "Please add token with header" });
  }
}

//Server Logic
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started working on ${PORT}`);
});
