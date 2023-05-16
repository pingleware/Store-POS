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

const fs = require("fs");
const os = require("os");
const path = require("path");

let stripe = null;
let locationID = null;

if (fs.existsSync(path.join(os.homedir(),'.storepos/stripe.json'))) {
    const stripe_settings = require(path.join(os.homedir(),'.storepos/stripe.json'));
    console.log(stripe_settings)
    if (stripe_settings.live) {
        stripe = require('stripe')(stripe_settings.secret.live);
    } else {
        stripe = require('stripe')(stripe_settings.secret.test);
    }
    if (stripe_settings.terminal.locationid) {
        locationID = stripe_settings.terminal.locationid;
    }
    async () => {
        const configurations = await stripe.terminal.configurations.list({
            is_account_default: true,
          });
        console.log(configurations)    
    }
}


/*
if (platform) {
    if (platform.stripestatus && platform.stripestatus == "live") {
        stripe = require('stripe')(platform.stripelivesecret);
    } else {
        stripe = require('stripe')(platform.stripetestsecret);
    }    
}
*/

/**
 * Routes for interacting with a terminal reader
 */
app.get("/readers", async (req,res) => {
    try {
        const { data: readers } = await stripe.terminal.readers.list();
        console.log(readers)
        res.json({status: "success", readersList: readers});
      } catch(e) {
        res.json({status: "error", message: e.message});
      }    
})

app.get('/reader/locationid', async (req, res) => {
    res.send(locationID);
})

app.post('/reader/connection_token', async (req, res) => {
    let connectionToken = await stripe.terminal.connectionTokens.create();
    res.json({secret: connectionToken.secret});
});

app.post("/reader/process-payment", async (req, res) => {
    try {
        const { amount, currency, readerId } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            currency: currency.toLowerCase(),
            amount,
            payment_method_types: ["card_present"],
            capture_method: "manual"
        });
        const reader = await stripe.terminal.readers.processPaymentIntent(readerId, {
            payment_intent: paymentIntent.id
        })
        res.send({status: "success", reader: reader, paymentIntent: paymentIntent});
    } catch(e) {
        res.send({status: "error", message: e.message});
    }
})

app.post("/reader/simulate-payment", async (req,res) =>{
    try {
        const { readerId } = req.body;
        const reader = await stripe.testHelpers.terminal.readers.presentPaymentMethod(readerId);
        res.send({status: 'success', reader: reader});
    } catch(e) {
        res.send({status: 'error', message: e.message});
    }
})

app.post("/reader/capture", async (req,res) => {
    try {
        const { paymentIntentId } = req.body;
        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        res.send({status: "success", paymentIntent: paymentIntent});
    } catch(e) {
        res.send({status: 'error', message: e.message});
    }
})

app.post("/reader/cancel", async (req, res) => {
    try {
        const { readerId } = req.body;
        const reader = await stripe.terminal.readers.cancelAction(readerId);
        res.send({reader});     
    } catch(e) {
        res.status(400).json({status: 'error', message: e.message});
    }
})


/**
 * Routes for non-reader interaction
 */

app.post("/paymentintent", async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(req.body.amount) * 100,
            currency: req.body.currency.toLowerCase(),
            payment_method_types: [req.body.type]
        });
        res.status(200).json({status: 'success', paymentIntent: paymentIntent});       
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

        //console.log(`${event.id} PaymentIntent (${paymentIntent.id}:${paymentIntent.status})`);
        res.status(200).json({received: true});
    } else if (event.type === 'charge.succeeded') {
        const paymentIntent = event.data.object;
        //console.log(`${event.id} PaymentIntent (${paymentIntent.payment_intent}:${paymentIntent.status}) Receipt URL (${paymentIntent.receipt_url})`)
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
        // TODO: invoke pos.js:$.fn.submitDueOrder from this stripe callback
        res.status(200).json({received: true});
    } else {
        res.status(200).json({received: true});
    }
});

