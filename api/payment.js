const express = require("express");
const app = require( "express" )();
const server = require( "http" ).Server( app );
const bodyParser = require( "body-parser" );
const Datastore = require( "nedb" );
const async = require( "async" );

app.use( bodyParser.json() );

module.exports = app;

const createDirectory = require("./functions");
var _path = createDirectory('POS');
_path = createDirectory('POS/server');
_path = createDirectory('POS/server/databases');
const path = require("path");

//let settingsDB = new Datastore( {
//    filename: path.join(_path,"settings.db"),
//    autoload: true
//} );

/**
 * See https://www.youtube.com/watch?v=WG4ehXSEpz4 for creating a payment intent
 */
app.post("/webhook",express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event = req.body;

    /**
     * IMPORTANT
     * =========
     * TODO: verify signatures manually, see https://stripe.com/docs/webhooks/signatures#verify-manually
     */
    //try {
    //    //var webhookSecret = "whsec_c9ae00a87f8677b3fc25827361c96a252ed4197f19e6519fb3321a1f747d2983";
    //    event = stripe.webhooks.constructEvent(req.body,sig,webhook_secret);
    //} catch(error) {
    //    return res.status(400).send(`Webhook Error: ${error.message}`);
    //}

    if (event.type === 'payment_intent.created') {
        const paymentIntent = event.data.object;

        console.log(`${event.id} PaymentIntent (${paymentIntent.id}:${paymentIntent.status})`);
        res.status(200).json({received: true});
    } else if (event.type === 'charge.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`${event.id} PaymentIntent (${paymentIntent.payment_intent}:${paymentIntent.status}) Receipt URL (${paymentIntent.receipt_url})`)
        var sql = `UPDATE orders SET receipt_url='${paymentIntent.receipt_url}' WHERE paymentintent_id='${paymentIntent.payment_intent}'`;
        console.log(sql);
        res.status(200).json({received: true});

        //db.all(sql,[],function(err,rows){
            // Invoke @pingleware/bestbooks-helpers:salesCard
            /**
             * A sale has been made with money received, but product is still in warehouse,
             * the money received muts be entered into the unearned revenue,
             * when the item is shipped or delivered, the unearned revenue is move to Bank or Cash.
             * 
             * Unearned revenue is not accounts receivable. Accounts receivable are considered assets to the company because they represent money owed 
             * and to be collected from clients. 
             * 
             * Unearned revenue is a liability because it represents work yet to be performed or products yet to be provided to the client.
             * 
             * When the sale is complete, the unearned revenue (Liability) amount is transfer to the revenue account (Asset).
             */
        //    const { unearnedRevenue } = require('@pingleware/bestbooks-helpers');
        //    var description = `MYKRONEECAFE.KITCHEN Sale for Order #${paymentIntent.metadata.ordernum}`;
        //    unearnedRevenue(paymentIntent.created,description,Number(paymentIntent.amount / 100));
        //    var message = `delivery on ${paymentIntent.metadata.deliverydate} at ${paymentIntent.metadata.deliverytime}`;
        //    if (paymentIntent.metadata.deliverytime == "USPS") {
        //        message = `shipping on ${paymentIntent.metadata.deliverydate}`;
        //    }
        //    desktop_notification('New Order for MYKRONEECAFE.KITCHEN',`Order #${paymentIntent.metadata.ordernum} for ${message}`);
        //    res.status(200).json({received: true});
        //})
    } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        // TODO: update paid status to yes
        var sql = `UPDATE orders SET paid='yes' WHERE paymentintent_id='${paymentIntent.id}';INSERT INTO status (ordernum,txdate,status) VALUES ('${paymentIntent.metadata.ordernum}',DATETIME('now','localtime'),'order paid successfully');`;
        console.log(sql);
        res.status(200).json({received: true});
        /*
        db.all(sql,[],function(err,rows){
            var http = require('follow-redirects').http;
            var fs = require('fs');
            
            var options = {
                'method': 'POST',
                'hostname': 'localhost',
                'port': 8001,
                'path': '/api/new',
                'headers': {
                'Content-Type': 'application/json'
                },
                'maxRedirects': 20
            };
            
            var request = http.request(options, function (response) {
                var chunks = [];
            
                response.on("data", function (chunk) {
                chunks.push(chunk);
                });
            
                response.on("end", function (chunk) {
                var body = Buffer.concat(chunks);
                console.log(body.toString());
                res.status(200).json({received: true});
                });
            
                response.on("error", function (error) {
                console.error(error);
                });
            });
            
            var postData = JSON.stringify({
                "order": `${paymentIntent.metadata.ordernum}`,
                "ref_number": "",
                "discount": "",
                "customer": 1682639106,
                "status": 1,
                "subtotal": "10.00",
                "tax": 0,
                "order_type": 1,
                "items": [
                {
                    "id": 1682480035,
                    "product_name": "Banana Bread Loaf",
                    "price": "10.00",
                    "quantity": 2
                }
                ],
                "date": `${new Date(paymentIntent.created).toISOString()}`,
                "payment_type": `${paymentIntent.payment_method_types[0]}`,
                "payment_info": `${paymentIntent.latest_charge}`,
                "total": `${Number(paymentIntent.amount)/100}`,
                "paid": `${Number(paymentIntent.amount)/100}`,
                "change": "0.00",
                "id": `${paymentIntent.id}`,
                "till": 1,
                "user": "Administrator",
                "user_id": 1
            });
            
            request.write(postData);
            
            request.end();                    
        })
        */
    } else {
        res.status(200).json({received: true});
    }
});
