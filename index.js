'use strict';
const mongoose = require('mongoose');

module.exports = function mongooseLeanId(schema) {
  schema.post('find', attachId);
  schema.post('findOne', attachId);
  schema.post('findOneAndUpdate', attachId);
};

function getter(binary) {
  if (binary == null) return undefined;
  if (!(binary instanceof mongoose.Types.Buffer.Binary)) return binary;

  var len = binary.length();
  var b = binary.read(0,len);
  var buf = new Buffer(len);
  var hex = '';

  for (var i = 0; i < len; i++) {
    buf[i] = b[i];
  }

  for (var i = 0; i < len; i++) {
    var n = buf.readUInt8(i);

    if (n < 16){
      hex += '0' + n.toString(16);
    } else {
      hex += n.toString(16);
    }
  }

  return hex.substr(0, 8) + '-' + hex.substr(8, 4) + '-' + hex.substr(12, 4) + '-' + hex.substr(16, 4) + '-' + hex.substr(20, 12);
}

function attachId(res) {
  if (res == null) {
    return
  }

  function replaceId(res) {
    if (Array.isArray(res)) {
      res.forEach((v, index) => {
        if (isObjectId(v)) {
          return;
        }
        if (v._id && v._id instanceof mongoose.Types.Buffer.Binary) {
          var id = getter(v._id);
          v.id = id;
          // v._id = id;
        } else if (v instanceof mongoose.Types.Buffer.Binary) {
          var id = getter(v);
          res[index] = id;
        }
        Object.keys(v).map(k => {
          if (Array.isArray(v[k])) {
            replaceId(v[k]);
          }
        });
      });
    } else {
      if (isObjectId(res)) {
        return res;
      }
      if (res._id && res._id instanceof mongoose.Types.Buffer.Binary) {
        var id = getter(res._id);
        res.id = id;
        // res._id = id;
      }
      Object.keys(res).map(k => {
        if (Array.isArray(res[k])) {
          replaceId(res[k]);
        }
      });
    }
  }

  if (this._mongooseOptions.lean) {
    replaceId(res);
  }
}

function isObjectId(v) {
  if (v == null) {
    return false;
  }
  const proto = Object.getPrototypeOf(v);
  if (proto == null || proto.constructor == null || proto.constructor.name !== 'ObjectID') {
    return false;
  }
  return v._bsontype === 'ObjectID';
}
