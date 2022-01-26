const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config()
const port = process.env.PORT || 5000
const fileUpload = require('express-fileupload')

app.use(cors())
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xohwd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db("travelmania");
        const usersCollection = database.collection('users');
        const blogsCollection = database.collection('blogs');


        //POST API- all users siging with email
        app.post('/users', async (req, res) => {
            const users = await usersCollection.insertOne(req.body);
            res.json(users);
        });

        //PUT API -user
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        //Update user role 
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });


        //POST API for  new blog
        app.post("/blogs", async (req, res) => {
            const userName = req.body.userName;
            const address = req.body.address;
            const status = req.body.status;
            const userEmail = req.body.userEmail;
            const placeName = req.body.placeName;
            const expenses = req.body.expenses;
            const descriptions = req.body.descriptions;
            const date = req.body.date;
            const time = req.body.time;
            const image = req.files.image;
            const imageData = image.data;
            const encodedData = imageData.toString('base64')
            const imgBuffer = Buffer.from(encodedData, 'base64')
            const data = {
                userEmail, userName, placeName, expenses, descriptions, time, date, address, status,
                image: imgBuffer
            }
            const result = await blogsCollection.insertOne(data);
            res.json(result);
        })


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('TravelMania!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})