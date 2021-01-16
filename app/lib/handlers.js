const { RSA_PKCS1_PSS_PADDING } = require('constants');
const _data = require('./data');
const helpers = require('./helpers');
const handlers = {}
handlers.ping = (data, callback) => {
    callback(200)
}

handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._users = {};

handlers._users.post = (data, callback) => {
    // @todo - add valllidators 
    const {firstName = '', lastName = '', phone ='', password ='', tosAgreement = false } = data.payload;
    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, (err, data)=> {
            if(err) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    const user = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement  
                    }
                    _data.create('users', phone, user, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {Error: 'Could not create the new user' });
                        }
                    })
                } else {
                    callback(500, {Error: 'Could not hash password'});
                }
            } else {
                callback(400, {Error: 'User already exist'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required  fields'});
    }

}
// @TODO - authentication + autherization
handlers._users.get = (data, callback) => {
    const { phone = '' } = data.queryStringObject;
    if (phone) {
        _data.read('users', phone, (err, data )=> {
            if (!err && data) {
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }

        })

    } else {
        callback(400, {Error: 'missing required field'})
    }

}
// @TODO - authentication + authorization
handlers._users.put = (data, callback) => {
    const {firstName, lastName, phone , password } = data.payload;
    if (phone) {
        if (firstName || lastName || password) {
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    if (firstName) {
                        userData.firstName = firstName;
                    }
                    if (lastName) {
                        userData.lastName = lastName;
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }
                    _data.update('users', phone, userData, err => {
                        if (!err) {
                            callback(200)
                        } else {
                            console.log(err);
                            callback(500, {Error: 'Could not update the user'});
                        }
                    })
                } else {
                    callback(400, {Error: 'User not found'})
                }
            } )
        } else {
            callback(400, {Error: 'Missing fields to update'});
        }
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// @TODO - authentication + authorization
// @TODO - delate related files
handlers._users.delete = (data, callback) => {
    const { phone } = data.queryStringObject;
    if (phone) {
        _data.read('users', phone, (err, data )=> {
            if (!err && data) {
                _data.delete('users', phone, err => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {Error: 'Could not delete user'});
                    }
                })
               
            } else {
                callback(400, {Error: 'could not find the specified user'});
            }

        })

    } else {
        callback(400, {Error: 'missing required field'})
    }
}

handlers.notFound = (data,  callback) => {
    callback(404);
}

module.exports = handlers;