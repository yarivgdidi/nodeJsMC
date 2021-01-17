const { RSA_PKCS1_PSS_PADDING } = require('constants');
const _data = require('./data');
const { hash } = require('./helpers');
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

handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._tokens = {};

handlers._tokens.verifyToken = (id, phone, callback) => {
    _data.read('tokens', id , (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false)
        }
    })
}

handlers._tokens.post = (data, callback) => {
    const { phone, password } = data.payload;
    if (phone && password) {
        _data.read('users', phone, (err, userData) => {
            if(!err && userData) {
                const hashedPassword = helpers.hash(password)
                if (hashedPassword == userData.hashedPassword ) {
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 *60 ;
                    const tokenObject = {
                        phone,
                        id: tokenId,
                        expires,
                    }
                    _data.create('tokens', tokenId, tokenObject, err => {
                        if (!err) {
                            callback(200, tokenObject)
                        } else {
                            callback (500, {Error: 'Could not create token'});
                        }
                    })

                } else {
                    callback(400, {Error: 'Password did not match' })
                }
            } else {
                callback(400, {Error: 'Could not find the specified user' } )
            }
        })
    } else {
        callback(400, {Error: 'Missing required field(s)'})
    }
}
handlers._tokens.get = (data, callback) => {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        _data.read('tokens', id, (err, tokenData )=> {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        })

    } else {
        callback(400, {Error: 'missing required field'})
    }
}

handlers._tokens.put = (data, callback) => {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend ? true : false
    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, tokenData, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callbak (500, {Error: 'Error extending token'} );
                        }
                    })
                } else {
                    callback(400, {Error: 'Token is already expired'});
                }

            } else {
                callback(404, {Error: 'Token does not exist'});
            }
        })
    } else {
        callback(400, {Error: 'missing required field'})
    }
}

handlers._tokens.delete = (data, callback) => {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        _data.read('tokens', id, (err, data )=> {
            if (!err && data) {
                _data.delete('tokens', id, err => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {Error: 'Could not delete token'});
                    }
                })
               
            } else {
                callback(400, {Error: 'could not find the specified token'});
            }

        })

    } else {
        callback(400, {Error: 'missing required field'})
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

handlers._users.get = (data, callback) => {
    const { phone } = data.queryStringObject;
    if (phone) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        handlers._tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data )=> {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
        
                })
            } else {
                callback(403, {Error: 'Missing token or token invalid'})
            }
        });
    } else {
        callback(400, {Error: 'missing required field'})
    }

}

handlers._users.put = (data, callback) => {
    const {firstName, lastName, phone , password } = data.payload;
    if (phone) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        handlers._tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
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
                callback(403, {Error: 'Missing token or token invalid'})
            }
        });

    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// @TODO - delate related files
handlers._users.delete = (data, callback) => {
    const { phone } = data.queryStringObject;
    if (phone) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        handlers._tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
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
                callback(403, {Error: 'Missing token or token invalid'})
            }
         });
    } else {
        callback(400, {Error: 'missing required field'})
    }
}

handlers.notFound = (data,  callback) => {
    callback(404);
}

module.exports = handlers;