const fs = require('fs');
const path = require('path');
const { parseJsonToObject } = require('./helpers');
const helpers = require('./helpers');


const lib = {};

lib.baseDir = path.join(__dirname,'/../.data');

lib.create = (dir, file, data,   callback ) => {
    fs.open(lib.baseDir + '/'+ dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, (err)=>{
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing to file');
                }
            })
        } else {
            callback('Could not create new file, it may alrewady exist');
        }
    })
}

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, 'utf-8', (err,data)=>{
        if (!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData );
        } else {
            callback(err,data);
        }
      
    })
}

lib.update = (dir, file, data,   callback ) => {
    fs.open(lib.baseDir + '/'+ dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.ftruncate(fileDescriptor, err => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if (!err) {
                            fs.close(fileDescriptor, err => {
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('Error closing file', err);
                                }
                            });
                        } else {
                            callback('Error writing to file', err);
                        }
                    })
                } else {
                   callback('Error truncating file'); 
                }
        
            });
        } else {
            callback('Could not open file, it may not exist yet');
        }
    });
}

lib.delete = (dir, file, callback) => {
    fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, err => {
        err ? callback('Error deletinf file') : callback(false);
    } )
}

lib.list = (dir, callback) => {
    fs.readdir(`${lib.baseDir}/${dir}/`, (err,data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileNames = [];
            data.forEach(filename => {
                trimmedFileNames.push(filename.replace('.json', ''));
            })
            callback(false, trimmedFileNames);
        } else {
            callback(err, data)
        } 
    })
} 
module.exports = lib;