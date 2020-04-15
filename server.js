/*  
---------------------
    NPM Packages Required
    1. Express.js 
    2. Body-Parser
    3. Formidable
    4. PythonShell
---------------------
*/


 // Import/Require the dependent packages

const express = require("express");
const bodyParser=require("body-parser");
const formidable = require("formidable");
const { PythonShell } = require("python-shell");

// set up the app using express framework
const app = express();

// setup the global middlewares for the app for accessing static folder 
app.use(express.static("public"));

// setup the global middleware for parsing JSON data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// import/require the resultant data set information to send back to user
const resultInformation = require("./data");

/*  
---------------------------------
    Routes Setup for the server
---------------------------------
*/

// bring in the execute function from child process to execute shell commands
const { exec } = require('child_process');

// run the shell script to create folder test_images
const createScript = exec('sh shell_scripts/setupDir.sh');

// Index route : @GET method to access
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Wildcard route: @GET method to access (Error/Unwanted routes)
app.get("/*", (req, res) => {
    res.send("404! Not found");
});


// Post Route: @POST method to get get back the result from result analysis

/*
    @params:{Image} send from the client side
*/

app.post("/file_upload", (req, res, next) => {

   

    // set up the formidable package to handle images from request parameter
    const form = formidable({ multiples: true, uploadDir: __dirname + "/test_images", keepExtensions:true});
    
    var fileName, fileType, fileUploadPath;
    
    // parse the incoming request object with multiform type data
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
         
        // get access to required file details (name, path and type)
        fileName = files.file.name;
        fileType = files.file.type;
        fileUploadPath = files.file.path;

        // check to support images types
        const supportTypes = ["image/jpeg", "image/png", "image/jpg"];

        // spawn out python script with required arguments
        let options={
            args : [fileUploadPath]
        }

        // error check if incoming data is image (with limited types above)
        if (supportTypes.includes(fileType)) {
            
            // run the python script to do the image analysis 
            PythonShell.run("label_image.py", options, (err, result) => {
              if (err) {
                throw err;
              }
                
                console.log(result)
                // run the shell script to delete files (image types)
                const deleteScript = exec('sh shell_scripts/deleteDir.sh');
                
                // send the analysed report from the python script
                if (result.length !== 0)
                    res.send(resultInformation(result[2]));

                // return: Error messsage if no result is predicted
                else
                    res.json({ Error: "No information found!" });
            });
        }
        // for not supported file types return back with appropriate message
        else {
            
            // delete non image file types
            const deleteScript = exec('sh shell_scripts/deleteDir.sh');
            
            res.json({ "Error": "File type not supported! Kindly upload an image!" });
        }
        
       
    });
    
});



// listen the server at port:3000 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));