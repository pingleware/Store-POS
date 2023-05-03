const app = require( "express")();
const server = require( "http" ).Server( app );
const bodyParser = require( "body-parser" );
const Datastore = require( "nedb" );
const multer = require("multer");
const fileUpload = require('express-fileupload');
const fs = require('fs');
const os = require('os');

const createDirectory = require("./functions");
var _path = createDirectory('POS');
_path = createDirectory('POS/uploads');
const path = require("path");


const storage = multer.diskStorage({
    destination:  path.join(os.homedir(),'.storepos/POS/uploads'),
    filename: function(req, file, callback){
        callback(null, Date.now() + '.jpg'); // 
    }
});

let upload = multer({storage: storage});

app.use( bodyParser.json() );

module.exports = app;

_path = createDirectory('POS/server');
_path = createDirectory('POS/server/databases');
 
let settingsDB = null;
try {
    settingsDB = new Datastore( {
        filename: path.join(os.homedir(),".storepos/POS/server/databases/settings.db"),
        autoload: true
    } );    
} catch(err) {}



app.get( "/", function ( req, res ) {
    res.send( "Settings API" );
} );


  
app.get( "/get", function ( req, res ) {
    settingsDB.findOne( {
        _id: 1
}, function ( err, docs ) {
        res.send( docs );
    } );
} );

 
app.post( "/post", upload.single('imagename'), function ( req, res ) {

    let image = '';

    if(req.body.img != "") {
        image = req.body.img;       
    }

    if(req.file) {
        image = req.file.filename;  
    }

    if(req.body.remove == 1) {
        const _path = path.join(os.homedir(),".storepos/POS/uploads/",req.body.img);
        try {
          if (fs.existsSync(_path)) fs.unlinkSync(_path)
        } catch(err) {
          console.error(err)
        }

        if(!req.file) {
            image = '';
        }
    } 
          
    let Settings = {  
        _id: 1,
        settings: {
            "app": req.body.app,
            "store": req.body.store,
            "address_one": req.body.address_one,
            "address_two":req.body.address_two,
            "contact": req.body.contact,
            "tax": req.body.tax,
            "symbol": req.body.symbol,
            "currency": req.body.currency,
            "percentage": req.body.percentage,
            "charge_tax": req.body.charge_tax,
            "footer": req.body.footer,
            "img": image,
            "stripe": {
                "live": (req.body.stripestatus ? true : false),
                "publishable": {
                    "live": req.body.stripelivepublishable,
                    "test": req.body.stripetestpublishable
                },
                "secret": {
                    "live": req.body.stripelivesecret,
                    "test": req.body.stripetestsecret
                },
                "terminal": {
                    "locationid": req.body.stripeterminallocationid
                }
            }
        }       
    }

    console.log(Settings.settings.stripe);
    fs.writeFileSync(path.join(os.homedir(),'.storepos/stripe.json'),JSON.stringify(Settings.settings.stripe));

    if(req.body.id == "") { 
        settingsDB.insert( Settings, function ( err, settings ) {
            if ( err ) res.status( 500 ).send( err );
            else res.send( settings );
        });
    }
    else { 
        settingsDB.update( {
            _id: 1
        }, Settings, {}, function (
            err,
            numReplaced,
            settings
        ) {
            if ( err ) res.status( 500 ).send( err );
            else res.sendStatus( 200 );
        } );

    }

});

 