const express = require('express');
const app = express();
const admin = require('firebase-admin');
app.use(express.static(__dirname + '/'));

const jsonAccount = require('./taluewos.json');

admin.initializeApp({
    credential: admin.credential.cert(jsonAccount),
    databaseURL: 'https://taluewos-6ce3e.firebaseio.com'
});

const _db = admin.firestore();

app.get("/Employee", (req, res) => {
    res.sendFile('Employee/index.html', { root: __dirname });
});

app.get("/Chef",(req,res)=>{
    res.sendFile('Chef/index.html', { root: __dirname });
});

app.get("/createCart", async (req, res) => {
    var array = [];
    await _db.collection('cart').doc(req.query.uuid).set({
        orders: [],
    });
    res.send("Ok");
});

app.get("/addToCart", async (req, res) => {
    console.log("Re");
    var tmp = {
        name: req.query.name,
        type: req.query.type,
        price: req.query.price,
        path: req.query.path,
        uuid: req.query.uuid,
        num: 1
    };
    console.log(tmp);
    var isHas = false;
    var order_num = 0;
    var order_array = [];
    await _db.collection('cart').doc(tmp.uuid).get().then((data) => {
        order_num = data.data().num;
        order_array = data.data().orders;
    });
    for (let i = 0; i < order_array.length; i++) {
        if (order_array[i]['name'] == tmp.name) {
            order_array[i]['num'] += 1;
            isHas = true;
        }
    }
    if (!isHas) {
        order_array.push({
            name: req.query.name,
            type: req.query.type,
            price: req.query.price,
            path: req.query.path,
            num: 1
        });
    }

    await _db.collection('cart').doc(tmp.uuid).set({
        orders: order_array
    });
    console.log(order_array);

    res.send("Ok");
});

app.get("/getCartList",async(req,res)=>{
    var jsonData;
    await _db.collection('cart').doc(req.query.uuid).get().then((data)=>{
        jsonData = data.data();
    });
    res.send(JSON.stringify(jsonData));
});

app.get("/getOrderList",async (req,res)=>{
    var jsonData = [];
    await _db.collection('orders').orderBy('date','asc').get().then((querySnapshot)=>{
        querySnapshot.forEach((doc)=>{
            var tmp = doc.data();
            tmp['id'] = doc.id;
            jsonData.push(tmp);
        });
        res.send(jsonData);
    });
});

app.get("/getAcceptList",async (req,res)=>{
    var jsonData = [];
    await _db.collection('accept').get().then((querySnapshot)=>{
        querySnapshot.forEach((doc)=>{
            var tmp = doc.data();
            tmp['id'] = doc.id;
            jsonData.push(tmp);
        });
        res.send(jsonData);
    });
});

app.get("/getOrderDetail",async(req, res)=>{
    var jsonData;
    await _db.collection('orders').doc(req.query.id).get().then((data)=>{
        console.log(data.data());
        jsonData = data.data();
    });
    res.send(JSON.stringify(jsonData))
});

app.get("/sendOrder",async(req,res)=>{
    var uuid = req.query.uuid;
    var table = req.query.table;
    var tmp;
    await _db.collection('cart').doc(uuid).get().then((data)=>{
        // console.log(data.data());
        tmp = data.data();
    });
    tmp['table'] = table;
    tmp['date'] = Date();
    await _db.collection('orders').add(tmp);

    res.send("Ok");
});

app.get("/resetOrder", async(req,res)=>{
    var uuid = req.query.uuid;
    await _db.collection('cart').doc(uuid).delete();
    res.send("Ok");
});

app.get("/confirmOrder", async(req,res)=>{
    var id = req.query.id;
    var tmp;
    await _db.collection('orders').doc(id).get().then((data)=>{
        tmp = data.data();
    });
    await _db.collection('orders').doc(id).delete();
    await _db.collection('accept').add(tmp);
    tmp['date'] = Date();
    await _db.collection('logs').add(tmp);
    res.send("Ok");
});

app.get("/deleteAccept",async(req, res)=>{
    var id = req.query.id;
    await _db.collection('accept').doc(id).delete();
    res.send("Ok");
});

app.listen(27580, (req, res) => {
    console.log("Running ...");
});