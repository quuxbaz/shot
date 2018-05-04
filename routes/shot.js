const puppeteer = require('puppeteer');
const os = require("os");
const uniqueFilename = require("unique-filename");
const fs = require("fs");
const express = require('express');

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
        const browser = await puppeteer.launch();
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

    const exec = require("child_process").exec
    const url = req.params.url;
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.setViewport({width: 1200, height: 768});
        await page.goto(url);
        await page.screenshot({
            landscape: true,
            fullPage: true, 
            type: "jpeg", 
            quality: 100,
            path: uniq + ".jpg",
        });

        const cmd = "jpeg2pdf.exe -o "+uniq+".pdf -z fw -r height "+uniq+".jpg"
        console.log("Issuing: " + cmd);
        exec(cmd, (error, stdout, stderr) => {
            console.log("error: " + error);
            console.log("stderr: " + stderr);
            console.log("stdout: " + stdout);
            res.sendFile("./"+uniq+".pdf", {root: __dirname + "/../"}, function (err) { 
                if (err) {
                    next(err);
                } else {
                    console.log("Sent: "+uniq+".pdf");
                }
            });
        });

        await browser.close();
    })();
});

// router.post("/png", function (req, res, next) {
//     const uniq = uniqueFilename(".");
//     console.log("Unique filename: " + uniq);

//     const url = req.body.url;
//     (async () => {
//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();
//         await page.goto(url);
//         await page.screenshot({fullPage: true, path: uniq+".png"});
//         res.sendFile("./"+uniq+".png", {root: __dirname + "/../"}, function (err) { 
//             if (err) {
//                 next(err);
//             } else {
//                 console.log("Sent: "+uniq+".png");
//             }
//         });
//         await browser.close();
//     })();
// });

// router.post("/pdf-okay-1", function (req, res, next) {
//     const exec = require("child_process").exec
//     const cmd = "jpeg2pdf.exe -o print.pdf -z fw -r height toledo.jpeg"
//     exec(cmd, (error, stdout, stderr) => {
//         console.log(error);
//         console.log(stderr);
//         console.log(stdout);
//         res.sendFile("./print.pdf", {root: __dirname + "/../"}, function (err) { 
//             if (err) {
//                 next(err);
//             } else {
//                 console.log("Sent: print.pdf");
//             }
//         });
//     });
// });

// router.post("/exec", function (req, res, next) {
//     const exec = require("child_process").exec
//     const cmd = "echo 123"
//     exec(cmd, (error, stdout, stderr) => {
//         res.send(stdout);
//     });
// });

router.get("/xpdf/:url", function (req, res, next) {
    console.log(req.params.url);
    res.send("Okay.");
});

module.exports = router;
