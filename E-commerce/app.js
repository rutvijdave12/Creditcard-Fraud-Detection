const express               = require('express');
      passport              = require('passport');
      app                   = express();
      bodyParser            = require('body-parser');
      mongoose              = require('mongoose');
      session               = require('express-session');
      LocalStrategy         = require("passport-local"),
      passportLocalMongoose = require('passport-local-mongoose');
//  multer=require('multer');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));



mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: String

});


userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);//User Data


const bookSchema = new mongoose.Schema({
    bookname: String,
    para1: String,
    para2: String,
    para3: String,
    himg: String,
    bookimage: String
})

const Book = new mongoose.model("Book", bookSchema);//book data

const billSchema = new mongoose.Schema({
    name: String,
    mnumber: String,
    address: String,
    city: String,
    country: String,
    cost: Number,
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }
})

const Bookbuy = new mongoose.model("Bookbuy", billSchema); //billing data

app.use(session({
    secret: 'Alohomora',
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});


app.get('/', (req, res) => {
    const book = Book.find({}, (err, allBooks) => {
        if (err) {
            console.log(err);
        } else {
            res.render('index', { books: allBooks });
        }
    });

})


app.get('/sign-in', (req, res) => {
    res.render('sign-in');
})

app.post("/sign-in", isNotLoggedIn, passport.authenticate("local",
    {
        successRedirect: "/",
        failureRedirect: "/sign-in",
        badRequestMessage: 'Missing username or password.',
    }), function(req, res){
        console.log("in")
});



app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/sign-up', (req, res) => {
    res.render('sign-up');
})

app.post('/sign-up', (req, res) => {
    User.register({ username: req.body.username, email: req.body.email }, req.body.password, function (err, user) {

        if (err) {
            console.log(err)
            res.redirect("/sign-up");
        } else {

            passport.authenticate("local", { session: true })(req, res, function () {
                res.redirect("/");

            })
        }

    })


})


app.get('/:id', isLoggedIn, (req, res) => {

    Book.findById(req.params.id, (err, foundBook) => {
        if (err) {
            console.log("9");
            console.log(err);
            console.log("10");
        } else {
            res.render('info', { book: foundBook });
        }
    })

})





app.get('/:id/bill', isLoggedIn, (req, res) => {
    Book.findById(req.params.id, (err, foundBook) => {
        if (err) {
            console.log("13");
            console.log(err);
            console.log("14");
        } else {
            res.render('bill', { book: foundBook });
        }
    })

})

app.post('/:id/bill', isLoggedIn, (req, res) => {


    const userBill = new Bookbuy({
        name: req.body.name,
        mnumber: req.body.number,
        address: req.body.address,
        country: req.body.country,
        city: req.body.city,
        book: req.params.id,
        cost: 20

    });

    userBill.save(function (err, savedBill) {
        if (err) {
            console.log("15")
            console.log(err)
            console.log("16")
        } else {
            res.redirect("/" + savedBill._id + "/bill/checkout");
        }
    })

})

app.get('/:id/bill/checkout', isLoggedIn, (req, res) => {

    Bookbuy.findById(req.params.id).populate("book").exec(function (err, foundBill) {
        if (err) {
            console.log("17");
            console.log(err)
            console.log("18");
        } else {
            // console.log(foundBill);
            res.render('checkout', { bill: foundBill });
        }
    })


})

app.get('/:id/bill/checkout/pay', isLoggedIn, (req, res) => {

    Bookbuy.findById(req.params.id).populate("book").exec((err, foundBill) => {
        if (err) {
            console.log("19");
            console.log(err)
            console.log("20");
        } else {
            res.render('pay', { bill: foundBill });
        }

    })

})


// Middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        res.redirect("/sign-in");
    }
}

function isNotLoggedIn(req, res, next){
	if(!req.isAuthenticated()){
		return next();
	}
	else{
		res.redirect("/");
	}
} 




app.listen('3000', () => {
    console.log('Server is Started Sucessfully');
})
