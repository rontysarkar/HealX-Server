const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY)

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      // "https://cardoctor-bd.web.app",
      // "https://cardoctor-bd.firebaseapp.com",
    ],
  })
);







// mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dam4d01.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const medicineCollection = client.db("HealXDB").collection("medicine");
    const cartCollection = client.db("HealXDB").collection("cart");
    const usersCollection = client.db("HealXDB").collection("users");
    const categoryCollection = client.db("HealXDB").collection("category");
    const advertiseCollection = client.db("HealXDB").collection("advertise");


    //  JWT toke api 

    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.SECRET_TOKEN_KEY,{expiresIn: '1h'});
      res.send({token})
    })



    //  verify meddle ware

    const verifyToken = (req,res,next) =>{
      if(!req.headers.authorization){
        return res.status(401).send({message:'Unauthorized access'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token,process.env.SECRET_TOKEN_KEY,(err,decoded)=>{
        if(err){
          return res.status(401).send({message : 'unauthorized access'})
        }
        req.decoded = decoded
        next()
      })
    }

    // verify admin 

    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email
      const user = await usersCollection.findOne({email:email})
      const isAdmin = user?.role === 'admin'
      if(!isAdmin){
        return res.status(403).send({message : "Forbidden access"})
      }
      next()
    }




    //    Users Api       //

    app.get('/users/:email',verifyToken,async(req,res)=>{
      const query = {email: req.params.email}
      if(req.params.email !== req.decoded.email){
        return res.status(403).send({message : "Forbidden Access"})
      }
      const options = {
        projection: { _id: 0, role: 1, }
      }
      const result = await usersCollection.findOne(query,options)
      res.send(result)
    })

    app.get("/users",verifyToken,verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const doc = {
        $set: {
          role: user.role,
        },
      };
      const result = await usersCollection.updateOne(filter, doc);
      res.send(result);
    });



    // Category APi

    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    app.post("/category",verifyToken, async (req, res) => {
      const categoryInfo = req.body;
      const result = await categoryCollection.insertOne(categoryInfo);
      res.send(result);
    });

    app.delete("/category/:id",verifyToken,verifyAdmin, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });

    //  advertise  api

    app.get("/advertise",verifyToken, async (req, res) => {
      const { email } = req.query;
      let query = {};
      if (email) {
        query.sellerEmail = email;
      }
      const result = await advertiseCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/advertise",verifyToken,async(req,res)=>{
      const data = req.body;
      const doc = {
        ...data
      }
      const result = await advertiseCollection.insertOne(doc)
      res.send(result)
    })

    app.patch("/advertise",verifyToken, async (req, res) => {
      const data = req.body;
      const filter = { _id: new ObjectId(data.id) };
      const doc = {
        $set: {
          medicineImage:data.image
        },
      };
      const result = await advertiseCollection.updateOne(filter,doc)
      res.send(result)
    });

    app.delete("/advertise/:id",verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await advertiseCollection.deleteOne(query);
      res.send(result);
    });

    //       Medicine api    //

    app.get("/medicines", async (req, res) => {
      const result = await medicineCollection.find().toArray();
      res.send(result);
    });

    app.post('/medicines',async(req,res)=>{
      const data = req.body;
      const doc = {
        ...data
      }
      const result = await medicineCollection.insertOne(doc);
      res.send(result)
    })

    app.delete('/medicine/:id',async(req,res)=>{
      const query = {_id: new ObjectId(req.params.id)}
      const result = await medicineCollection.deleteOne(query)
      res.send(result)
    })

    //  Cart API  ///

    app.post("/cart", async (req, res) => {
      const data = req.body;
      const doc = {
        ...data,
      };
      const result = await cartCollection.insertOne(doc);
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/cart", async (req, res) => {
      const result = await cartCollection.deleteMany({
        userEmail: req.query.email,
      });
      res.send(result);
    });

    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // Stripe intent 
    app.post("/create-payment-intent",async(req,res)=>{
      const {price} = req.body;
      const amount = parseInt(price * 100)
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency: "usd",
        payment_method_types:['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

// mongodb

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, () => {
  console.log(`server is running port is ${port}`);
});
