const port = process.env.PORT || 5000;
const express = require("express");
const route = require("./routes");
const cors = require("cors");
const app = express();

app.use(express.static("public"));
app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors());
app.use("/api", route);

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
