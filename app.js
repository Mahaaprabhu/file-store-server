const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const GridFsStream = require('gridfs-stream');
const ObjectID = require('mongodb').ObjectID



const app = express();
app.use(express.json());

/*
const gridStorage = new GridFsStorage(
  {
    url: 'mongodb://localhost/demo',
    file: (req, file) => {
      return {
        filename: file.originalname
      };
    }
  },
);
*/
const atlasGridStorage = new GridFsStorage({
  url: 'mongodb+srv://DemoUser:DemoUser@democluster.nif8l.mongodb.net/DemoCluster?retryWrites=true&w=majority',
  file: (req, file) => {
    return {
      filename: file.originalname
    };
  }
});
const upload = multer({ storage: atlasGridStorage });


app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', false);
  next();
});

// Create mongo connection
const conn = mongoose.createConnection('mongodb+srv://DemoUser:DemoUser@democluster.nif8l.mongodb.net/DemoCluster?retryWrites=true&w=majority');

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = GridFsStream(conn.db, mongoose.mongo);
  //gfs.collection('uploads');
});


app.post('/media/', upload.single('file'), (req, res) => {
    try {
      res.send(req.file);
    }catch(err) {
      console.log(err);
      res.send(400);
    }
});

app.delete('/media/file/:id', (req, res) => {
  console.log(`To remove media file: ${req.params.id}`);
  gfs.remove({_id: ObjectID(req.params.id)}, function (err, file) {
    if (err) return handleError(err);
    console.log(`Removed media file: ${req.params.id}`);
    return res.json(file || []);
  });
});

app.get('/media/file/:id', (req, res) => {
  gfs.files.findOne({_id: ObjectID(req.params.id)}, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    const readstream = gfs.createReadStream(file.filename);
    res.attachment(file.filename);
    readstream.pipe(res);
  });
});

app.get('/media/metadata/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    return res.json(files || []);
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('App is up and running!');
});
