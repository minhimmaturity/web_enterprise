const fs = require('fs');
const removeFile = (files) => {
  for (let index = 0, len = files.length; index < len; index++) {
    console.log(files[index].path);
    fs.unlinkSync(files[index].path);
  }
};

module.exports = removeFile;
