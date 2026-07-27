const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routerApi = require('./src/routes');

const app = express();
const fileUpload = require('express-fileupload');
//const port = 3002;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(cors(/*{
    origin: 'http://localhost:3000' 
}*/));

routerApi(app);

app.listen(process.env.PORT, ()=> {
    console.log("Servidor iniciado en http://localhost:" + process.env.PORT);
});