'use strict';

const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;
const crypto = require('crypto');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const bucketName = process.env.STORAGE_BUCKET;
if (!bucketName) {
    throw 'The STORAGE_BUCKET environment variable is not defined';
}

const domainWhitelistString = process.env.DOMAIN_WHITELIST;
if (!domainWhitelistString) {
    throw 'The DOMAIN_WHITELIST environment variable is not defined';
}
const domainWhitelist = domainWhitelistString.split(',');
console.log('Whitelisted domains: ' + domainWhitelist.join(', '));

module.exports.index = async (event, context) => {
    if (!event.queryStringParameters || !event.queryStringParameters.url) {
        return {
            statusCode: 400,
            body: JSON.stringify('A URL must be provided: /?url=<url to export to pdf>'),
        }
    }
    const url = event.queryStringParameters.url;
    const force = event.queryStringParameters.force;

    // Check that the URL is in the whitelist
    if (!isWhitelisted(url)) {
        return {
            statusCode: 400,
            body: JSON.stringify(`The URL ${url} is not a whitelisted URL`),
        }
    }

    // The file name will be a hash of the URL
    const s3Key = sha1(url) + '.pdf';

    let pdf = null;
    if (!force) {
        try {
            // Fetch the PDF file
            const s3Response = await s3.getObject({
                Bucket: bucketName,
                Key: s3Key,
            }).promise();
            pdf = s3Response.Body;
        } catch (e) {
            // If not found, the `pdf` variable will be null
            if (e.code !== 'NoSuchKey') throw e;
        }
    }

    if (!pdf) {
        pdf = await createPdf(url);

        await s3.putObject({
            Bucket: bucketName,
            Key: s3Key,
            Body: pdf,
            ContentType: 'application/pdf',
        }).promise();
    }

    return {
        isBase64Encoded: true,
        statusCode: 200,
        body: pdf.toString('base64'),
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="Export.pdf"',
        },
    };
};

/**
 * @param url
 * @returns {Promise<Buffer>}
 */
async function createPdf(url) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            defaultViewport: {width: 1280, height: 800},
        });

        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: ['domcontentloaded', 'networkidle0'],
        });

        return await page.pdf({
            // width: 1280,
            printBackground: true,
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * @param string
 * @returns {string}
 */
function sha1(string) {
    return crypto.createHash('sha1').update(string).digest('hex');
}

function isWhitelisted(url) {
    const urlDomain = (new URL(url)).hostname;
    if (domainWhitelist.includes(urlDomain)) {
        return true;
    }
    // support subdomains
    for (let domain of domainWhitelist) {
        if (urlDomain.endsWith('.' + domain)) {
            return true;
        }
    }
    return false;
}
