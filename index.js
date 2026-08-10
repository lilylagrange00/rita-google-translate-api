const querystring = require("querystring");
const got = require("got");
const languages = require("./languages");

function translate(text, opts, gotopts) {
   console.log("Input text:", text);
   console.log("Options:", opts);
   console.log("Gotoptions:", gotopts);

   // Set default options if not provided
   opts = opts || {};
   gotopts = gotopts || {};

   // Validate language options
   let e;
   [opts.from, opts.to].forEach(function (lang) {
      if (lang && !languages.isSupported(lang)) {
         e = new Error();
         e.code = 400;
         e.message = `The language '${lang}' is not supported`;
      }
   });
   if (e) {
      return Promise.reject(e);
   }

   // Set default values for unspecified options
   opts.from = opts.from || "auto";
   opts.to = opts.to || "en";
   opts.tld = opts.tld || "com";

   // Get language codes
   opts.from = languages.getCode(opts.from);
   opts.to = languages.getCode(opts.to);

   // Construct URL for translation request
   let url = `https://translate.google.${opts.tld}/translate_a/t`;
   const data = {
      "client": opts.client || "dict-chrome-ex",
      "sl": opts.from,
      "tl": opts.to,
      "hl": opts.to,
      "dt": ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"],
      "ie": "UTF-8",
      "oe": "UTF-8",
      "otf": 1,
      "ssel": 0,
      "tsel": 0,
      "kc": 7,
      "q": text
   };
   url = `${url}?${querystring.stringify(data)}`;

   // Send translation request and process response
   return got(url, gotopts)
      .then(function (res) {
         console.log("Response body:", res.body);

         const result = {
            "text": "",
            "pronunciation": "",
            "from": {
               "language": {
                  "didYouMean": false,
                  "iso": ""
               },
               "text": {
                  "autoCorrected": false,
                  "value": "",
                  "didYouMean": false
               }
            },
            "raw": ""
         };

         // Parse response body
         const body = JSON.parse(res.body);

         // Extract translated text
         if (Array.isArray(body)) {
            body.forEach(function (obj) {
               if (Array.isArray(obj) && obj[0]) {
                  result.text += obj[0].trim();
               }
            });
         }

         // Print translated text
         console.log("Translated text:", result.text);

         return result;
      })
      .catch(function (err) {
         console.error("Error occurred:", err);
         throw err;
      });
}

module.exports = translate;
module.exports.languages = languages;
