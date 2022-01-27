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
        const spotsCollection = database.collection('spots');


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
            const pic = req.body.pic;
            const rating = req.body.rating;
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
                userEmail, userName, placeName, expenses, descriptions, time, date, address, status, rating, pic,
                image: imgBuffer
            }
            const result = await blogsCollection.insertOne(data);
            res.json(result);
        });

        //GET API for all the blogs showing UI
        app.get("/blogs", async (req, res) => {
            console.log(req.query)
            const result = blogsCollection.find({});
            //for pagination
            const currentPage = req.query.currentPage;
            const perPageBlog = parseInt(req.query.perPageBlog);
            let blog;
            const count = await result.count()
            if (currentPage) {
                blog = await result.skip(currentPage * perPageBlog).limit(perPageBlog).toArray()
            } else {

                blog = await result.toArray();
            }
            res.send({
                count,
                blog
            });

        });

        app.get("/blogs/:id", async (req, res) => {
            const blogDetails = await blogsCollection.findOne({ _id: ObjectId(req.params.id) });
            res.send(blogDetails);
        })



        //Update blogs status api
        app.put('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const updateStatus = req.body;
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    status: updateStatus.status
                }
            };
            const result = await blogsCollection.updateOne(filter, updateDoc, options);
            res.json(result);

        });
        //POST API- for top stops
        app.post('/spots', async (req, res) => {
            const spots = await spotsCollection.insertOne(req.body);
            res.json(spots);
        });
        //GET API for all the top spots UI
        app.get("/spots", async (req, res) => {
            const result = spotsCollection.find({});
            const spots = await result.toArray();
            res.send(spots);

        });

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