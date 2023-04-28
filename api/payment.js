const express = require("express");
const app = require( "express" )();
const server = require( "http" ).Server( app );
const bodyParser = require( "body-parser" );
const Datastore = require( "nedb" );
const async = require( "async" );

require('dotenv').config()

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
let Store = require('electron-store');
let storage = new Store();
let platform = storage.get('settings');

var stripe = null;

if (platform.stripestatus && platform.stripestatus == "live") {
    stripe = require('stripe')(platform.stripelivesecret);
} else {
    stripe = require('stripe')(platform.stripetestsecret);
}


app.post("/paymentintent", async (req, res) => {
    try {
        console.log(req.body);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(req.body.amount) * 100,
            currency: req.body.currency,
            payment_method_types: [req.body.type]
        });
        res.status(200).json({status: 'success', id: paymentIntent.id,clientSecret: paymentIntent.client_secret});       
    } catch(e) {
        res.status(400).json({status: 'error', message: e.message});
    }
})

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
    if (event.type === 'payment_intent.created') {
        const paymentIntent = event.data.object;

        console.log(`${event.id} PaymentIntent (${paymentIntent.id}:${paymentIntent.status})`);
        res.status(200).json({received: true});
    } else if (event.type === 'charge.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`${event.id} PaymentIntent (${paymentIntent.payment_intent}:${paymentIntent.status}) Receipt URL (${paymentIntent.receipt_url})`)
        /**
         * Should invoke  $(this).submitDueOrder(paymentIntent); change argument from status to payment intent
         */
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
        //    var description = `${settings.setor} Sale for Order #${paymentIntent.metadata.ordernum}`;
        //    unearnedRevenue(paymentIntent.created,description,Number(paymentIntent.amount / 100));
        //    var message = `delivery on ${paymentIntent.metadata.deliverydate} at ${paymentIntent.metadata.deliverytime}`;
        //    if (paymentIntent.metadata.deliverytime == "USPS") {
        //        message = `shipping on ${paymentIntent.metadata.deliverydate}`;
        //    }
        //    desktop_notification('New Order for ${settings.setor}',`Order #${paymentIntent.metadata.ordernum} for ${message}`);
        //    res.status(200).json({received: true});
        //})
    } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        // TODO: update paid status to yes
        var sql = `UPDATE orders SET paid='yes' WHERE paymentintent_id='${paymentIntent.id}';INSERT INTO status (ordernum,txdate,status) VALUES ('${paymentIntent.metadata.ordernum}',DATETIME('now','localtime'),'order paid successfully');`;
        console.log(sql);
        res.status(200).json({received: true});
    } else {
        res.status(200).json({received: true});
    }
});
