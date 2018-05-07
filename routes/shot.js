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

router.get("/image/:url", function (req, res, next) {
    const uniq = uniqueFilename(".");
    console.log("Unique filename: " + uniq);

    const url = req.params.url;
    (async () => {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(url);
        await page.screenshot({fullPage: true, path: uniq+".png"});
        res.sendFile("./"+uniq+".png", {root: __dirname + "/../"}, function (err) { 
            if (err) {
                next(err);
            } else {
                console.log("Sent: "+uniq+".png");
            }
        });
        await browser.close();
    })();
});

router.get("/pdf/:url", function (req, res, next) {
    const uniq = uniqueFilename(".");
    console.log("Unique filename: " + uniq);
    const url = req.params.url;
    (async () => {
        console.log("Starting Chrome...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({width: 1200, height: 768});
        await page.setDefaultNavigationTimeout(60*1000); // miliseconds
        console.log("Visiting website...");
        await page.goto(url);
        console.log("Taking screenshot...");
        await page.screenshot({
            landscape: true,
            fullPage: true, 
            type: "png", 
            // quality: 100,
            path: uniq + ".png",
        });
        await browser.close();
        console.log("Closed browser.")
        var dim = sizeOf(uniq + ".png");
        console.log("Got dimensions.")
        /* Now instantiate a PDF document, set it to the size of the
         * dimensions of the image, write it to disk, send the file.
         * After you get this done, consider not saving images and
         * PDFs to disk.  In other words, learn to work with Chrome
         * Buffers and PDF blobs.  This is the best way to do things
         * here.  Keep the file system clean and safe. */

        console.log("Creating PDF...");
        var pdf = await new PDFDocument({
            layout: "landscape",
            size: [dim.height, dim.width]
        });
        console.log("Inserting image...");
        await pdf.image(uniq + ".png", 0, 0);
        console.log("Writing to file system...");
        await pdf.pipe(fs.createWriteStream(uniq + ".pdf")
        ).on("finish", function () {
            console.log("PDF written");
            console.log("Sending file out...");
            res.sendFile("./"+uniq+".pdf", {root: __dirname + "/../"}, function (err) { 
                if (err) {
                    next(err);
                } else {
                    console.log("Sent: "+uniq+".pdf");
                }
            });
        })
        await pdf.end();
    })();
});

module.exports = router;
