const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(
    cors({
      origin: [
        "http://localhost:5173",
        // "https://cardoctor-bd.web.app",
        // "https://cardoctor-bd.firebaseapp.com",
      ]
    })
  );




// mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dam4d01.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    
    const medicineCollection = client.db('HealXDB').collection('medicine');
    const cartCollection = client.db('HealXDB').collection('cart');

    app.get('/medicines',async(req,res)=>{
        const result = await medicineCollection.find().toArray()
        res.send(result)
    })

    app.post('/cart',async(req,res)=>{
        const data = req.body
        const doc = {
          ...data
        }
        const result = await cartCollection.insertOne(doc);
        res.send(result)
    })

    app.delete('/cart/:id',async(req,res)=>{
      const query = {_id: new ObjectId(req.params.id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/cart',async(req,res)=>{
      const result = await cartCollection.deleteMany({"userEmail" : req.query.email})
      res.send(result)
    })

    app.get('/cart/:email',async(req,res)=>{
      const email = req.params.email;
      const query = {userEmail:email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

// mongodb


app.get('/',(req,res)=>{
    res.send('hello world')
})

app.listen(port,()=>{
    console.log(`server is running port is ${port}`)
})