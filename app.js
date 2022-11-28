// ----------------------Standardt code---------------------------

const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const keygen = require("keygenerator");


const app = express();

require('dotenv').config();



const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://admin-filip:test123@cluster0.kl1kndo.mongodb.net/eshopDB', {
  useNewUrlParser: true
});

// mongodb://localhost:27017/eshopDB
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));
app.use("/clothes", express.static('public'));
app.use("/clothes/:filters/:page", express.static('public'))
app.use("/accessories", express.static('public'));
app.use("/item", express.static('public'));
app.use("/cart/order", express.static('public'));

app.use("/cart/order/finish", express.static('public'));





const store = MongoStore.create({
  mongoUrl: 'mongodb+srv://admin-filip:test123@cluster0.kl1kndo.mongodb.net/eshopDB',
  crypto: {
    secret: process.env.MONGOSTORE_SECRET
  }
})

// 'mongodb://localhost:27017/eshopDB'

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.set('view engine', 'ejs');

const clothSchema = mongoose.Schema({
  name: String,
  season: String,
  label: String,
  price: Number,
  size: String,
  quantity: Number,
  type: String
});

const Cloth = mongoose.model("Cloth", clothSchema);

const accSchema = mongoose.Schema({
  name: String,
  season: String,
  label: String,
  price: Number,
  size: String,
  quantity: Number,
  type: String
});

const Accessory = mongoose.model("Accessory", accSchema);


// --------------------------GET, POST and code----------------------------

app.get("/", function(req, res) {
  if (!req.session.itemsInCart) {


    req.session.itemsInCart = 0;
  }
  res.render("home", {
    itemsInCart: req.session.itemsInCart
  });
});

// ------------------------------CLOTHES -----------------------------------------




// ---------------------------------Pages with clothes / Clothes part---------------------------------

app.get("/clothes/:page", function(req, res) {

  Cloth.find({}, function(err, products) {
    let pages = [];
    const numberOfPages = Math.ceil((products.length) / 12);
    for (var i = 0; i < numberOfPages; i++) {
      if (numberOfPages === 1) {
        pages.push(products);
      } else {
        if (i !== numberOfPages - 1) {
          pages.push(products.slice(12 * i, 12 * (i + 1)));
        } else {
          pages.push(products.slice(12 * i, ));
        }
      }
    }
    let pageNumber = Number(req.params.page.slice(-1));
    let active = [];
    let nextPage
    let prevPage
    for (let i = 1; i < pages.length + 1; i++) {
      active.push("white");
    }

    active[pageNumber - 1] = "text-dark";

    if (pageNumber < pages.length) {
      nextPage = "/clothes/page"+(pageNumber + 1);
    } else {
      nextPage = "/clothes/page"+pageNumber;
    }

    if (pageNumber > 1) {
      prevPage = "/clothes/page" + (pageNumber-1);
    } else {
      prevPage = "/clothes/page1";
    }

    res.render("clothes", {
      products: pages[pageNumber - 1],
      numberOfPages: pages.length,
      active: active,
      nextPage: nextPage,
      prevPage: prevPage,
      itemsInCart: req.session.itemsInCart
    });

  });

});

// ------------------------------------Clothes with filters----------------------------

app.get("/clothes/:filters/:page", function(req,res){
  let filterArray = req.params.filters.split("&");

  let filters= {};
  filterArray.forEach(function(item){
    let array = item.split("=");
    const [attribute, value] = array;
    if (attribute ==="type"){
      if (filters.type){
        filters.type.push(value);
      }
      else{
        filters.type =[value];

      }
    }
    else if (attribute==="season"){
      if (filters.season){
        filters.season.push(value);
      }
      else {
        filters.season = [value];

      }
    }

  });

  Cloth.find(filters, function(err, products) {
    let pages = [];
    const numberOfPages = Math.ceil((products.length) / 12);
    for (var i = 0; i < numberOfPages; i++) {
      if (numberOfPages === 1) {
        pages.push(products);
      } else {
        if (i !== numberOfPages - 1) {
          pages.push(products.slice(12 * i, 12 * (i + 1)));
        } else {
          pages.push(products.slice(12 * i, ));
        }
      }
    }
    let pageNumber = Number(req.params.page.slice(-1));
    let active = [];
    let nextPage
    let prevPage
    for (let i = 1; i < pages.length + 1; i++) {
      active.push("white");
    }

    active[pageNumber - 1] = "text-dark";

    if (pageNumber < pages.length) {
      nextPage = "/clothes/"+req.params.filters+"/page"+(pageNumber + 1);
    } else {
      nextPage = "/clothes/"+req.params.filters+"/page"+pageNumber;
    }

    if (pageNumber > 1) {
      prevPage = "/clothes/"+req.params.filters+"/page" + (pageNumber-1);
    } else {
      prevPage = "/clothes/"+req.params.filters+"/page1";
    }

    res.render("clothes", {
      products: pages[pageNumber - 1],
      numberOfPages: pages.length,
      active: active,
      nextPage: nextPage,
      prevPage: prevPage,
      itemsInCart: req.session.itemsInCart
    });

  });


});


//--------------------------- Single Cloth (or accs) Page--------------------------------------------

app.get("/item/:id", function(req, res) {
  Cloth.findOne({
    _id: req.params.id
  }, function(err, object) {
    if (err) {
      res.send(err);
    } else {
      if (object!==null){
        res.render("itemCloth", {
          item: object,
          itemsInCart: req.session.itemsInCart
        });
      }
      else{
        Accessory.findOne({
          _id:req.params.id
        }, function(err,object){
          if (err){
            res.send(err);
          }
          else{
            res.render("itemAcc",{
              item:object,
              itemsInCart: req.session.itemsInCart
            });
          }
        })
      }

    }
  })
})

// Add Cloth Item to Cart

app.post("/item/cloth", function(req, res) {
  Cloth.findById(req.body.id, function(err, item) {
    item.size = req.body.size;

    let check = -1;
    if (!req.session.cart) {
      req.session.cart = [];
      item.quantity = 1;
      req.session.cart.push(item);

    } else {
      req.session.cart.forEach(element => {
        if (element._id === req.body.id && element.size === req.body.size) {
          check = req.session.cart.indexOf(element);
        }
      });


      if (check === -1) {
        item.quantity = 1;
        req.session.cart.push(item);
      } else {
        req.session.cart[check].quantity += 1;
      }
    }



    req.session.itemsInCart += 1;
    req.session.save();

  })
  res.status(204).send();

});


// Add Acc Item to Cart

app.post("/item/acc", function(req, res) {
  Accessory.findById(req.body.id, function(err, item) {
    item.size = req.body.size;

    let check = -1;
    if (!req.session.cart) {
      req.session.cart = [];
      item.quantity = 1;
      req.session.cart.push(item);

    } else {
      req.session.cart.forEach(element => {
        if (element._id === req.body.id && element.size === req.body.size) {
          check = req.session.cart.indexOf(element);
        }
      });


      if (check === -1) {
        item.quantity = 1;
        req.session.cart.push(item);
      } else {
        req.session.cart[check].quantity += 1;
      }
    }



    req.session.itemsInCart += 1;
    req.session.save();

  })
  res.status(204).send();

});




// ----------------------------------------Cart-------------------------------------------------------

app.get("/cart", function(req, res) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  if (req.session.cart.length === 0) {
    res.render("cartEmpty", {
      itemsInCart: req.session.itemsInCart
    })
  } else {
    res.render("cart", {
      cart: req.session.cart,
      itemsInCart: req.session.itemsInCart
    });
  }


});

// Remove Item from Cart

app.post("/cart", function(req, res) {
  let id = req.body.id;
  let size = req.body.size;
  let cart = req.session.cart;
  cart.forEach(function(element) {
    if (element._id.toString() === id && element.size === size) {
      let index = cart.indexOf(element);
      req.session.itemsInCart -= element.quantity;
      cart.splice(index, 1);

    }
  })

  req.session.cart = cart;

  if (req.session.cart.length === 0) {
    res.render("cartEmpty", {
      itemsInCart: req.session.itemsInCart
    })
  } else {
    res.render("cart", {
      cart: req.session.cart,
      itemsInCart: req.session.itemsInCart
    });
  }
})



// Update Cart / Change Quantity of Item

app.post("/cart/change", function(req, res) {
  let cart = req.session.cart;
  cart.forEach(function(item) {
    if (req.body.id === item._id) {
      if (req.body.quantity > item.quantity) {
        req.session.itemsInCart += (req.body.quantity - item.quantity);
      } else {
        req.session.itemsInCart -= (item.quantity - req.body.quantity);
      }
      item.quantity = req.body.quantity;

    }
  });

  req.session.cart = cart;
  req.session.save();


});


//Proceed to Payment/ Complete order

app.get("/cart/order", function(req, res) {
  let totalPrice = 0;
  let fiveDate = new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000));
  fiveDate = fiveDate.toLocaleDateString();
  let sevenDate = new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000));
  sevenDate = sevenDate.toLocaleDateString();
  req.session.cart.forEach(item => {
    totalPrice += Math.round(item.quantity * Number(item.price) * 100) / 100;;
  })


  res.render("order", {
    totalPrice: totalPrice,
    itemsInCart: req.session.itemsInCart,
    arrivalDate: {
      fiveDate: fiveDate,
      sevenDate: sevenDate
    },
    cart: req.session.cart

  })


});



// ------------------------------- Send order to Mailchimp store-------------------------


app.post("/cart/order", function(req, res) {

  const client = require("mailchimp-marketing");
  client.setConfig({
    apiKey: process.env.API_ID,
    server: "us14",
  });

  let totalPrice = 0;
  req.session.cart.forEach(item => {
    totalPrice += Math.round(item.quantity * Number(item.price) * 100) / 100;;
  })

  let lines = [];
  req.session.cart.forEach(function(item) {
    let line = {
      id: "line_"+req.session.cart.indexOf(item),
      product_id: item._id,
      product_variant_id: item._id,
      quantity: Number(item.quantity),
      price:Number(item.price)
    }
    lines.push(line)
  });

  const run = async () => {
    const response = await client.ecommerce.addStoreOrder("Fays_store", {
      id: keygen._() ,
      customer: {
        id: keygen._(),
        email_address: req.body.email,
        opt_in_status: false,
        first_name: req.body.name,
        last_name: req.body.surname,
        address: {
          address1:req.body.address
        }
      },
      currency_code: "USD",
      order_total:totalPrice,
      lines: lines
    });
    console.log(response);


  };

  run();
  req.session.cart = [];
  req.session.itemsInCart = 0;
  req.session.save();

  res.redirect("/cart/order/finish");



});


// ---------- Finish order Message--------------------

app.get("/cart/order/finish", function(req, res) {

  res.render("finishOrder", {
    itemsInCart: req.session.itemsInCart
  })

});



// ---------------------------------------- Contact---------------------------------------------------------


app.get("/contact", function(req, res) {


  res.render("contact", {
    itemsInCart:req.session.itemsInCart
  })

});


// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- - Accessories-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -

app.get("/accessories/:page", function(req, res) {
  Accessory.find({}, function(err, products) {
    let pages = [];
    const numberOfPages = Math.ceil((products.length) / 12);
    for (var i = 0; i < numberOfPages; i++) {
      if (numberOfPages === 1) {
        pages.push(products);
      } else {
        if (i !== numberOfPages - 1) {
          pages.push(products.slice(12 * i, 12 * (i + 1)));
        } else {
          pages.push(products.slice(12 * i, ));
        }
      }
    }
    let pageNumber = Number(req.params.page.slice(-1));
    let active = [];
    let nextPage
    let prevPage
    for (let i = 1; i < pages.length + 1; i++) {
      active.push("white");
    }

    active[pageNumber - 1] = "text-dark";

    if (pageNumber < pages.length) {
      nextPage = "/accessories/page"+(pageNumber + 1);
    } else {
      nextPage = "/accessories/page"+pageNumber;
    }

    if (pageNumber > 1) {
      prevPage = "/accessories/page" + (pageNumber-1);
    } else {
      prevPage = "/accessories/page1";
    }

    res.render("clothes", {
      products: pages[pageNumber - 1],
      numberOfPages: pages.length,
      active: active,
      nextPage: nextPage,
      prevPage: prevPage,
      itemsInCart: req.session.itemsInCart
    });

  });

});








// ---------------------------Port listen --------------------------------
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started at port 3000");
});
