PDF generator built as a serverless application.

Runs on AWS Lambda, built with Serverless and [Lift](https://github.com/getlift/lift).

## Why?

This is a small application that turns web pages into PDF.

- Turns HTML pages to PDF using Chrome Headless and Puppeteer
- Runs on AWS Lambda: extremely cheap, deploys in 1 minute, scales automatically
- Generated PDFs are cached in AWS S3 to be served faster

This allows to generate PDF files by simply implementing web pages in your application.

Clear and simple API for your application:

```
https://123456.execute-api.us-east-1.amazonaws.com/pdf?url=<URL to export>
```

## Demo

Try the live demo:

https://7f3oaopd3c.execute-api.us-east-1.amazonaws.com/pdf?url=https://bref.sh/docs/

☝️ the link above will export the [bref.sh/docs/](https://bref.sh/docs/) page into a PDF.

Feel free to change the URL to export. However, the demo only allows generating PDF from the `bref.sh` domain.

## Deployment

- Install and set up [the Serverless Framework](https://www.serverless.com/framework/docs/getting-started/)
- Clone this repository
- Install dependencies: `npm ci`
- Run `serverless deploy`

The URL of the deployed application should display in the terminal.

## Usage

Call the application's URL and append the `?url=` query parameter with the URL of the page you wish to export.

For example:

```
https://123456.execute-api.us-east-1.amazonaws.com/pdf?url=https://mywebsite.com/
```

The exported PDF will be returned.

### Force regeneration

PDF are generated on the first HTTP call and cached into S3. That makes subsequent responses much faster.

To force regenerating the PDF (for example if the web page has changed), add the `force=1` query parameter to the URL.

## Configuration

Change the `DOMAIN_WHITELIST` environment variable to set the whitelisted domains.

Indeed, to avoid abuse, the application will only generate PDFs from pre-approved domain names.
