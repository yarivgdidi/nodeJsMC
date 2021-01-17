const { RSA_PKCS1_PSS_PADDING } = require('constants');
const config = require('./config');
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

handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._checks[data.method](data, callback);
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
                                let deletionErros = false;
                                let checksDeleted = 0;
                                const {userChecks} = data;
                                const checksToDelete = userChecks.length;
                                userChecks.forEach(checkId => {
                                    _data.delete('checks', checkId, err => {
                                        if (err) {
                                            deletionErros = true;
                                        }
                                        checksDeleted++;
                                        if(checksDeleted == checksToDelete) {
                                            callback(200)
                                        } else {
                                            callback(500, { Error: 'Errors while deleting user checks'});
                                        }
                                    })
                                
                                })
                                
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

handlers._checks = {}

handlers._checks.post = (data, callback) => {
    // @TODO - add validators
    const {protocol, url: _url = '', method, successCodes, timeoutSeconds } = data.payload;
    const url = _url.trim();
    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && token) {
                const userPhone = tokenData.phone;
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                      const { userChecks = [] } = userData;
                      if (userChecks.length < config.maxChecks) {
                            const checkId = helpers.createRandomString(20);
                            const checkObject = { 
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds
                            }
                            _data.create('checks', checkId, checkObject, err=>{
                                if (!err) {
                                   userData.userChecks = userChecks;
                                   userData.userChecks.push(checkId);
                                   _data.update('users', userPhone, userData, err => {
                                       if ( !err) {
                                         callback(200, checkObject);
                                       } else {
                                        callback(500, {Error: 'Could not update user'})
                                       }
                                   })
                                } else {
                                    callback(500, {Error: 'Could not create the new check'})
                                }
                            })
                      } else {
                          callback (400, {Error: `Number of checks exeeded ${config.maxChecks} `});
                      }
                    } else {
                         callback(403);
                    }
                })

            } else {
                callback(403);
            }
        }); 

    } else {
        callback(400, {Error: 'Missing required inputs or inputs are invalid'})
    }

};
handlers._checks.get = (data, callback) => {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) {
                        callback(200, checkData);
                    } else {
                        callback(403, {Error: 'Missing token or token invalid'})
                    }
                });
            } else {
                callback(404)
            }
        })      
    } else {
        callback(400, {Error: 'missing required field'})
    }
};
handlers._checks.put = (data, callback) => {
    const {id, protocol, url: _url = '', method, successCodes, timeoutSeconds } = data.payload;
    const url = _url.trim();
    if (id && (protocol || url || method || successCodes || timeoutSeconds)) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) {
                        if (protocol) checkData.protocol = protocol;
                        if (url) checkData.url = url;
                        if (method) checkData.method = method;
                        if (successCodes) checkData.successCodes = successCodes;
                        if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;
                        _data.update('checks', id, checkData, err => {
                            if (!err) {
                                callback(201)
                            } else {
                                callback (500, {Error: "Error update checks"});
                            }
                        })
                    } else {
                        callback(403, {Error: 'Missing token or token invalid'})
                    }
                })
            } else {
                callback(400, {Error: 'Check not found'})
            }
        })
        
    } else {
        callback(400, {Error: 'Missing required field'});
    } 
};
handlers._checks.delete = (data, callback) => {
    const { id } = data.queryStringObject;
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) { 
                        _data.delete('checks', id, err => {
                            if (!err) {
                                _data.read('users', checkData.userPhone, (err, userData )=> {
                                    if (!err && userData) {
                                        const {userChecks} = userData;
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            _data.update('users', checkData.userPhone, userData, err => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {Error: 'Error updating user with deleted checks'})
                                                }
                                            })

                                        } else {
                                            callback(500, {Error: 'Could not found check in user ' })
                                        }
                                    } else { 
                                       callback(500, {Error: 'could not find the specified user'});
                                    }
                                })
                            } else {
                                callback(500, {Error: 'Could not delete check'});
                            }
                            
                        });
                    } else {
                        callback(403, {Error: 'Missing token or token invalid'})
                    }
                })
            } else {
                callback(400, {Error: 'missing check'});
            }
        }) 
              
    } else {
        callback(400, {Error: 'missing required field'})
    }
};

handlers.notFound = (data,  callback) => {
    callback(404);
}




module.exports = handlers;