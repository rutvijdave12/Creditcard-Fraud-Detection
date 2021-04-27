from flask import Flask, request, jsonify, render_template, url_for, flash, redirect, session, request, logging
from flask_sqlalchemy import SQLAlchemy 
from flask_marshmallow import Marshmallow
from passlib.hash import sha256_crypt
from flask_wtf import Form
from wtforms import StringField, PasswordField, BooleanField, TextAreaField, SelectField
from wtforms import validators
import pymysql
from functools import wraps
import os
from random import randint, choice
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
import string
import pickle
# import sklearn
import cloudinary as cloud
import cloudinary.uploader
from dotenv import load_dotenv
import requests
load_dotenv()
# import tensorflow
import tensorflow as tf





# Init app
# app = Flask(__name__)
app = Flask(__name__,template_folder='templates',static_folder = 'static')
app.config["SECRET_KEY"] = "secret123"


basedir = os.path.abspath(os.path.dirname(__file__))

# model = pickle.load(open("Model/fraud_self.pkl", 'rb'))

model = tf.keras.models.load_model('Model/balance2.h5')


# Cloudinary configuration
cloud.config.update = ({
    'cloud_name':os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'api_key': os.environ.get('CLOUDINARY_API_KEY'),
    'api_secret': os.environ.get('CLOUDINARY_API_SECRET')
})


# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///'+'cc.sqlite'
# app.config['SQLALCHMEY_TRACK_MODIFICATIONS'] = False

# db = SQLAlchemy(app)

# Database 
# app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://{username}:{password}@{server}/{database_name}".format(username='root',password='', server='localhost', database_name='bankDb')
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://{username}:{password}@{server}/{database_name}".format(username=os.environ.get("MYSQL_ADDON_USER"),password=os.environ.get("MYSQL_ADDON_PASSWORD"), server=os.environ.get("MYSQL_ADDON_HOST"), database_name=os.environ.get("MYSQL_ADDON_DB"))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Init db
db = SQLAlchemy(app)
# Init ma
ma = Marshmallow(app)


# User Class/Model
class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    address = db.Column(db.String(255))
    contact_no = db.Column(db.String(10))
    password = db.Column(db.String(200), nullable=False)
    photo_link = db.Column(db.Text)
    bank_accounts = db.relationship('BankAccount', backref='user')

    # def __init__(self, full_name, username, email):
    #     self.full_name = full_name
    #     self.username = username
    #     self.email = email

    def set_password(self, password):
        self.password = password


# User Schema
class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'full_name', 'username', 'email', 'address', 'contact_no', 'password', 'bank_accounts' )

# Init User Schema
user_schema = UserSchema()


# Bank Account Class/Model
class BankAccount(db.Model):
    __tablename__ = "bank_account"
    id = db.Column(db.Integer, primary_key=True)
    account_no = db.Column(db.String(20), nullable=False, unique=True)
    account_type = db.Column(db.String(50), nullable=False)
    balance = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    creditcard = db.relationship('CreditCard', uselist=False, backref='bank_account')
    transactions = db.relationship('AccountTransaction', backref='bank_account')

    # def __init__(self, account_no, account_type, balance, user_id):
    #     self.account_no = account_no
    #     self.account_type = account_type
    #     self.balance = balance
    #     self.user_id = user_id

# Bank Account Schema
class BankAccountSchema(ma.Schema):
    class Meta:
        fields = ('id', 'account_no', 'account_type', 'balance', 'user_id', 'creditcard', 'transactions')

# Init Bank Account Schema
bank_account_schema = BankAccountSchema()
bank_accounts_schema = BankAccountSchema(many=True)


# Credit Card Class/Model
class CreditCard(db.Model):
    __tablename__ = "credit_card"
    id = db.Column(db.Integer, primary_key=True)
    cc_no = db.Column(db.String(20), nullable=False, unique=True)
    cvv = db.Column(db.String(4), nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    amount_limit = db.Column(db.Integer, nullable=False)
    bank_account_id = db.Column(db.Integer, db.ForeignKey('bank_account.id'), nullable=False)
    creditcardstatement = db.relationship('CreditCardStatement', backref='credit_card')

    # def __init__(self, cc_no, cvv, expiry_date, amount_limit, bank_account_id):
    #     self.cc_no = cc_no
    #     self.cvv = cvv
    #     self.expiry_date = expiry_date
    #     self.amount_limit = amount_limit
    #     self.bank_account_id = bank_account_id

# Credit Card Schema
class CreditCardSchema(ma.Schema):
    class Meta:
        fields = ('id', 'cc_no', 'cvv', 'expiry_date', 'amount_limit', 'bank_account_id', 'creditcardstatement')

# Init Credit Card Schema
credit_card_schema = CreditCardSchema()

# Transaction Class/Model
class AccountTransaction(db.Model):
    __tablename__ = "account_transaction"
    id = db.Column(db.Integer, primary_key=True)
    transaction_time = db.Column(db.DateTime, nullable=False)
    transaction_id = db.Column(db.String(20), nullable=False, unique=True)
    amount = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    payment_status = db.Column(db.String(20), nullable=False)
    bank_account_id = db.Column(db.Integer, db.ForeignKey('bank_account.id'), nullable=False)

    # def __init__(self, bank_account_id, amount, status):
    #     self.bank_account_id = bank_account_id
    #     self.amount = amount
    #     self.status = status

# Transaction Schema
class TransactionSchema(ma.Schema):
    class Meta:
        fields = ('id', 'transaction_id', 'amount', 'transaction_type', 'status' 'bank_account_id')

# Init Transaction Schema
transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)

# Creditcard statement Class/Model
class CreditCardStatement(db.Model):
    __tablename__ = "cerdit_card_statement"
    id = db.Column(db.Integer, primary_key=True)
    transaction_time = db.Column(db.DateTime, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    actual_payment_date = db.Column(db.DateTime)
    transaction_id = db.Column(db.String(20), nullable=False, unique=True)
    amount = db.Column(db.Integer, nullable=False)
    payment_status = db.Column(db.String(20), nullable=False)
    creditcard_id = db.Column(db.Integer, db.ForeignKey('credit_card.id'), nullable=False)

    # def __init__(self, bank_account_id, amount, status):
    #     self.bank_account_id = bank_account_id
    #     self.amount = amount
    #     self.status = status

# Transaction Schema
class CreditCardStatementSchema(ma.Schema):
    class Meta:
        fields = ('id', 'transaction_id', 'amount', 'status', 'creditcard_id')

# Init Transaction Schema
credit_card_statement_schema = CreditCardStatementSchema()
credit_card_statements_schema = CreditCardStatementSchema(many=True)




# Developer class/Model
class Developer(db.Model):
    __tablename__  = "developer"
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    contact_no = db.Column(db.String(10), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    secret_api_key = db.Column(db.String(200), unique=True)


# Developer Schema
class DeveloperSchema(ma.Schema):
    class Meta:
        fields = ('id', 'full_name', 'username', 'email', 'contact_no', 'password', 'secret_api_key')

# Init Transaction Schema
developer_schema = DeveloperSchema()




# Login Form Class
class LoginForm(Form):
    username = StringField(label='', validators=[validators.InputRequired(), validators.Length(max=50)])
    password = PasswordField(label='', validators=[validators.InputRequired(), validators.Length(max=50)])


# Register Form Class
class RegisterForm(Form):
    full_name = StringField(label='', validators=[validators.InputRequired(), validators.Length(min=6, max=50)])
    username = StringField(label='', validators=[validators.InputRequired(), validators.Length(min=4, max=50)])
    email = StringField(label='', validators=[validators.InputRequired(), validators.Email(message="Invalid Email"), validators.Length(min=6, max=50)])
    password = PasswordField(label='', validators=[
        validators.DataRequired(),
        validators.EqualTo('confirm', message='Passwords do not match'),
        validators.Length(min=6, max=50)
    ])
    confirm = PasswordField(label='')

# Bank account form class
class AccountForm(Form):
    full_name = StringField(label='', validators=[validators.InputRequired(), validators.Length(min=6, max=50)])
    email = StringField(label='', validators=[validators.InputRequired(), validators.Email(message="Invalid Email"), validators.Length(min=6, max=50)])
    address = StringField('', validators=[validators.InputRequired(), validators.Length(max=200)])
    contact_no = StringField('', validators=[validators.InputRequired(), validators.Length(min=10)])
    account_type = SelectField('', validators=[validators.InputRequired()], choices=[('', 'Select Account Type'), ('current', 'Current'), ('savings', 'Savings') ])

# Developer Register Form Class
class DeveloperRegisterForm(Form):
    full_name = StringField(label='', validators=[validators.InputRequired(), validators.Length(min=6, max=50)])
    username = StringField(label='', validators=[validators.InputRequired(), validators.Length(min=4, max=50)])
    email = StringField(label='', validators=[validators.InputRequired(), validators.Email(message="Invalid Email"), validators.Length(min=6, max=50)])
    contact_no = StringField('', validators=[validators.InputRequired(), validators.Length(min=10)])
    password = PasswordField(label='', validators=[
        validators.DataRequired(),
        validators.EqualTo('confirm', message='Passwords do not match'),
        validators.Length(min=6, max=50)
    ])
    confirm = PasswordField(label='')

# check if user logged in
def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            flash("Please login first!", "danger")
            return redirect(url_for("login"))
    return wrap

# check if user is not logged in
def is_not_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            flash("You are logged in!", "danger")
            return redirect(url_for("index"))
        else:
            return f(*args, **kwargs)
    return wrap

# Account number
def random_with_N_digits(n):
    range_start = 10**(n-1)
    range_end = (10**n)-1
    return randint(range_start, range_end)


# Secret Key generator
def key_generator(size=50, chars=string.ascii_uppercase + string.digits):
    return ''.join(choice(chars) for _ in range(size))

# Routes

# Index
@app.route("/")
def index():
    return render_template("index.html")

# Register
@app.route("/register", methods=['GET', 'POST'])
@is_not_logged_in
def register():
    form = RegisterForm(request.form)
    if request.method == "POST" and form.validate_on_submit():
        full_name = form.full_name.data
        username = form.username.data
        email = form.email.data
        hashed_password = sha256_crypt.hash(str(form.password.data))
        user = User(full_name=full_name,username=username,email=email, password=hashed_password)
        # user.set_password(hashed_password)
        try:
            db.session.add(user)
            db.session.commit() 
        except:
            error = "Something went wrong!"
            return render_template("register.html", form=form, error=error)
        else:
            flash("You've registered successfully", "success")
            return redirect(url_for("login"))
    return render_template("register.html", form=form)

# photo route
@app.route("/<string:username>/photo", methods=['GET', 'POST'])
@is_logged_in
def photo(username):
    user = User.query.filter_by(username=username).first() 
    if request.method == "POST":
        try:
            print("inside post")
            img = request.form['photo']
            print(img)
            link = cloud.uploader.upload(img)
            print(link)
            # set photo link in the users
            user.photo_link = link['secure_url']
            # commit
            db.session.commit()
        except Exception as e:
            print(e)
            flash("Photograph Couldn't be taken, Try again", "error")
            return redirect("/"+ username + "/photo")
        print("done")
        flash("You are now logged in", "success")
        return redirect("/"+ username + "/accounts")
        # file.save(os.path.join(app.config['uploadFolder'], file.filename))
    print("inside get")
    return render_template("photo.html", user=user)

# Login
@app.route("/login", methods=["GET", "POST"])
@is_not_logged_in
def login():
    form = LoginForm(request.form)
    if request.method == "POST" and form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        user = User.query.filter_by(username=username).first()
        try:
            if(user):
                try:
                    if(sha256_crypt.verify(password, user.password)):
                        session['logged_in'] = True
                        session["username"] = username
                        print(user.photo_link)
                        if (user.photo_link == None):
                            return redirect("/"+ username + "/photo")
                        else:
                            flash("You are now logged in", "success")
                            return redirect("/"+ username + "/accounts")
                    else:
                        print("inner exception")
                        raise Exception
                except:
                    error = "Password is incorrect"
                    return render_template("login.html", form=form, error=error)
            else:
                raise Exception
        except:
            error = "Invalid Username"
            return render_template("login.html", form=form, error=error)
            
    return render_template("login.html", form=form)

# Logout
@app.route("/logout")
@is_logged_in
def logout():
    session.clear()
    flash("You are now logged out", "success")
    return redirect(url_for('login'))

# user accounts (index route)
@app.route("/<string:username>/accounts", methods=["GET", "POST"])
@is_logged_in
def accounts(username): 
    form = AccountForm(request.form)
    if request.method == "POST":
        if form.validate_on_submit():
            # get user
            user = User.query.filter_by(username=username).first()
            # set address
            user.address = form.address.data
            # set contact_no
            user.contact_no = form.contact_no.data
            # commit
            db.session.commit()
            # generate account_no
            while(True):
                account_no = str(random_with_N_digits(14))
                if (not BankAccount.query.filter_by(account_no=account_no).all()):
                    break
            # add details into the BankAccount model
            bank_account = BankAccount(account_no=account_no, account_type=form.account_type.data, balance= 0, user=user)
            # Add bank_account
            db.session.add(bank_account)
            # commit
            db.session.commit()

            # generate cc num
            while(True):
                cc_no = str(random_with_N_digits(16))
                if (not CreditCard.query.filter_by(cc_no=cc_no).all()):
                    break
            # generate cvv
            cvv = str(random_with_N_digits(3))
            # generate expiry date
            today = date.today()
            expiry_date = today.replace(today.year+3)
            # amount limit
            amount_limit = 50000
            # insert creditcard data
            creditcard = CreditCard(cc_no=cc_no, cvv=cvv, expiry_date=expiry_date, amount_limit=amount_limit, bank_account=bank_account)
            db.session.add(creditcard)
            db.session.commit()
             
            flash("Account has been created successfully!", "success")
            return redirect(("/" + username + "/accounts"))
        else:
            flash("Something Went Wrong, Try again!", "danger")
            return redirect("/" + username + "/accounts/new")
    if(username == session["username"]):
        user = User.query.filter_by(username=username).first()
        bank_accounts = user.bank_accounts

        return render_template("accounts.html", user=user, bank_accounts=bank_accounts)
    else:
        flash("Something went wrong", "danger")
        return redirect(url_for("index"))
    

# New Account (New route)
@app.route("/<string:username>/accounts/new", methods=["GET", "POST"])
@is_logged_in
def new(username):
    form = AccountForm(request.form)
    user = User.query.filter_by(username=username).first()
    return render_template("new.html", form=form, user=user)


# Account details (Show route)
@app.route("/<string:username>/accounts/<int:id>", methods=["GET", "POST"])
@is_logged_in
def show(username, id):
    bank_account = BankAccount.query.filter_by(id=id).first()
    user = bank_account.user
    return render_template("show.html", user=user, bank_account=bank_account)




# Developer's Page
@app.route("/developer", methods=["GET", "POST"])
def developer():
    return render_template("developer.html")

# Developer's Register page
@app.route("/developer/register", methods=["GET", "POST"])
def developer_register():
    form = DeveloperRegisterForm(request.form)
    if request.method == "POST":
        if form.validate_on_submit():   
            full_name = form.full_name.data
            email = form.email.data
            username = form.username.data
            contact_no = form.contact_no.data
            hashed_password = sha256_crypt.hash(str(form.password.data))
            # generate api_key
            while(True):
                secret_api_key = key_generator()
                if (not Developer.query.filter_by(secret_api_key=secret_api_key).all()):
                    break
            developer = Developer(full_name=full_name, email=email, username=username, contact_no=contact_no, password=hashed_password, secret_api_key=secret_api_key)
            try:
                db.session.add(developer)
                db.session.commit()
            except:
                flash("Something Went Wrong, Try again!", "danger")
                redirect("/developer/register")
            else:
                flash("You've registered successfully", "success")
                return "Your API Key is " + secret_api_key
        else:
            flash("Something Went Wrong, Try again!", "danger")
            return redirect("/developer/register")      
    return render_template("developer_register.html", form=form)


# Developer remote payment
@app.route("/<string:key>/remote_transaction", methods=["POST"])
def remote_transaction(key):
    print("IP address: " + request.remote_addr)
    try:
        developer = Developer.query.filter_by(secret_api_key=key).first()
        if(not developer):
            raise Exception
    except:
        return {"statusCode": "E00007", "message": "API key is invalid"}
    else:
        try:
            req_data = request.get_json()
            print(req_data)
            cc_no = req_data["cc_no"]
            cvv = req_data["cvv"]
            expiry = req_data["expiry"]
            expiry_date = date(int(expiry.split("-")[0]), int(expiry.split("-")[1]), int(expiry.split("-")[2]))
            amount = int(req_data["amount"])
            description = req_data["description"]
            merchant_account_no = req_data["merchant_account_no"]
            try:
                # Check if merchant's account exists
                merchant_bank_account = BankAccount.query.filter_by(account_no=merchant_account_no).first()
                if(merchant_bank_account):
                    credit_card = CreditCard.query.filter_by(cc_no=cc_no).first()
                    # check if the cc_no exists
                    try:
                        if(credit_card and credit_card.cvv == cvv):
                            try:
                                # check if cc has expired
                                if(date.today() <= credit_card.expiry_date):
                                    try:
                                        # check if amount exceeds cc limit
                                        if(amount <= credit_card.amount_limit):
                                            # set transaction time, due date, transaction_id, amount and payment_status
                                            transaction_time = datetime.now()
                                            due_date = date.today() + relativedelta(months=+1)
                                            transaction_id = key_generator(12).upper()
                                            amount = amount

                                            # extract transaction date and time
                                            day = int(transaction_time.strftime("%d"))
                                            month = int(transaction_time.strftime("%m"))
                                            year = int(transaction_time.strftime("%Y"))
                                            hour = int(transaction_time.strftime("%H"))
                                            minute = int(transaction_time.strftime("%M"))
                                            # Check from the ml model
                                            print("before model")
                                            prediction = model.predict([[amount, day, month, year, hour, minute]])
                                            print("after model")
                                            print(prediction[0][0])
                                            if prediction[0][0] > 0.4:
                                                user = User.query.filter_by(username=credit_card.bank_account.user.username).first()
                                                client_image = req_data["clientImg"]
                                                customer_image = user.photo_link
                                                response = requests.post("http://0.0.0.0:500/verify", json = {"client_image": client_image, "customer_image": customer_image})
                                                print(response)
                                                if not response:
                                                    print("in")
                                                    return {"statusCode": "E00050", "message": "The transaction was suspicious"} 
                                            payment_status = "pending"
                                            credit_card_statement = CreditCardStatement(transaction_time=transaction_time, due_date=due_date, transaction_id=transaction_id, amount=amount, payment_status=payment_status, credit_card=credit_card)
                                            # Add the transaction to customer's credit_card_statement
                                            try:
                                                db.session.add(credit_card_statement)
                                                db.session.commit()
                                            except Exception as e:
                                                print(e)
                                                return {"statusCode": "E00049", "message": "The transaction was unsuccessful"}
                                            # Reduce customer's cc limit
                                            credit_card.amount_limit -= amount
                                            db.session.commit()
                                            # Handle merchant's account_transaction
                                            merchant_transaction_id = key_generator(12).upper()
                                            amount=amount
                                            transaction_type = "credit"
                                            merchant_payment_status = "done"
                                            account_transaction = AccountTransaction(transaction_time=transaction_time, transaction_id=merchant_transaction_id, amount=amount, transaction_type=transaction_type, payment_status=merchant_payment_status, bank_account=merchant_bank_account)
                                            # Add the transaction to merchant's account_transaction
                                            try:
                                                db.session.add(account_transaction)
                                                db.session.commit()
                                            except:
                                                print(e)
                                                return {"statusCode": "E00049", "message": "The transaction was unsuccessful"}
                                            # Now update merchant's bank_account balance
                                            merchant_bank_account.balance += amount
                                            db.session.commit()
                                        else:
                                            return "Your Purchase amount exceeds your creditcard limit"
                                    except Exception as e:
                                        print(e)
                                        return {"statusCode": "E00027", "message": "The transaction was unsuccessful"}
                                else:
                                    raise Exception
                            except:
                                return {"statusCode": "E00023", "message": "Creditcard expired"}
                        else:
                            print("exception")
                            raise Exception
                    except:
                        return {"statusCode": "E00007", "message": "Invalid authentication values"}
                else:
                    raise Exception
            except:
                return {"statusCode": "E00008", "message": "Merchant is not currently active"}
        except:
            return {"statusCode": "E00049", "message": "The transaction was unsuccessful"}
    return {"statusCode": "I00001", "message": "Payment Successful"}



# Run server
if __name__ == "__main__":
    app.secret_key = "secret123"
    db.create_all()
    app.run(debug=True)