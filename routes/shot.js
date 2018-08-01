const puppeteer = require('puppeteer');
const os = require("os");
const uniqueFilename = require("unique-filename");
const fs = require("fs");
const express = require('express');
const sizeOf = require("image-size");
const PDFDocument = require('pdfkit');

var router = express.Router();

router.get("/help", function (req, res, next) {
    fs.readFile("public/interactive.html", function (err, data) {
        if (err) throw err;
        res.send(data.toString());
    });
});

var send_image = function (res, url, delay = 0) {
    const uniq = uniqueFilename(".");
    console.log("Unique filename: " + uniq);

    function sleep(s) {
        return new Promise(resolve => setTimeout(resolve, s * 1000));
    };

    (async () => {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(url, {waitUntil: 'networkidle2'});
        // console.log("sleeping " + delay + " seconds...")
        // await sleep(delay);
        await page.screenshot({fullPage: true, path: uniq + ".png"});
        res.sendFile("./" + uniq + ".png", {root: __dirname + "/../"}, function (err) { 
            if (err) {
                next(err);
            } else {
                console.log("Sent: " + uniq + ".png");
            }
        });
        await browser.close();
    })();
}

router.get("/image/:url/", function (req, res, next) {
    send_image(res, req.params.url, req.query.delay);
});

var send_pdf_with_screenshot = function (response, prefix, layout = "portrait") {
    /* Now instantiate a PDF document, set it to the size of the
     * dimensions of the image, write it to disk, send the file.
     * After you get this done, consider not saving images and
     * PDFs to disk.  In other words, learn to work with Chrome
     * Buffers and PDF blobs.  This is the best way to do things
     * here.  Keep the file system clean and safe. */

    var dim = sizeOf(prefix + ".png");
    var pdf = new PDFDocument({
        layout: layout,
        size: [595, 842]
    });

    const width = layout == "portrait" ? 595 : 842;
    
    pdf.image(prefix + ".png", 0, 0, {width: width});
    pdf.pipe(response)
    pdf.end();
}

router.get("/pdf-a4paper/:url", function (req, res, next) {
    const uniq = uniqueFilename(".");
    console.log("Unique filename: " + uniq);
    const url = req.params.url;

    const landscape = req.query.layout == "landscape" ? true : false;
    const fullpage = req.query.fullpage == "yes" ? true : false;

    (async () => {
        console.log("Starting Chrome...");
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.setViewport({width: 1225, height: 1750}); // aspect ratio of 1/sqrt(2)
        await page.setDefaultNavigationTimeout(60*1000); // miliseconds
        console.log("Visiting website...");
        await page.goto(url, {waitUntil: 'networkidle2'});
        console.log("Taking screenshot...");
        console.log("Screenshot landscape: " + landscape);
        console.log("Screenshot fullpage: " + fullpage);
        await page.screenshot({
            landscape: landscape,
            fullPage: fullpage, 
            type: "png", 
            // quality: 100,
            path: uniq + ".png",
        });
        console.log("Closing browser...")
        await browser.close();
        console.log("Browser closed!")
        send_pdf_with_screenshot(res, uniq, req.query.layout);
    })();

});

router.get("/pdf-print-a4paper/:url", function (req, res, next) {
    const uniq = uniqueFilename(".");
    console.log("Unique filename: " + uniq);

    const url = req.params.url;

    const landscape = req.query.layout == "landscape" ? true : false;
    const fullpage = req.query.fullpage == "yes" ? true : false;

    (async () => {
        console.log("Starting Chrome...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({width: 1225, height: 1750}); // aspect ratio of 1/sqrt(2)
        await page.setDefaultNavigationTimeout(60*1000); // miliseconds
        console.log("Visiting website...");
        await page.goto(url, {waitUntil: 'networkidle2'});
        console.log("Taking screenshot...");
        await page.pdf({
            format: "A4",
            landscape: landscape,
            path: uniq + ".pdf",
        });
        console.log("Closing browser...")
        await browser.close();
        console.log("Browser closed!")
        res.sendFile("./" + uniq + ".pdf", {root: __dirname + "/../"}, function (err) { 
            if (err) {
                next(err);
            } else {
                console.log("Sent: " + uniq + ".pdf");
            }
        });

    })();

});

module.exports = router;
