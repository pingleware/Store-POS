const fs = require("fs");
const os = require("os");
const path = require("path");

function createRootPath() {
    if (!fs.existsSync(path.join(os.homedir(),'.storepos'))) {
        fs.mkdirSync(path.join(os.homedir(),'.storepos'));
    }
    return path.join(os.homedir(),'.storepos');
}

function createDirectory(_path) {
    var root = createRootPath();
    if (!fs.existsSync(path.join(root,_path))) {
        fs.mkdirSync(path.join(root,_path));
    }
    return path.join(root,_path);
}

module.exports = createDirectory;