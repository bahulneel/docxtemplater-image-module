var DOMParser, DocUtils, JSZip, XMLSerializer, fs, http, https, url,
  __slice = [].slice;

fs = require('fs');

DOMParser = require('xmldom').DOMParser;

XMLSerializer = require('xmldom').XMLSerializer;

JSZip = require('jszip');

url = require('url');

http = require('http');

https = require('https');

DocUtils = {};

DocUtils.env = fs.readFile != null ? 'node' : 'browser';

DocUtils.docX = [];

DocUtils.docXData = [];

DocUtils.getPathConfig = function() {
  if (DocUtils.pathConfig == null) {
    return "";
  }
  if (DocUtils.env === 'node') {
    return DocUtils.pathConfig.node;
  }
  return DocUtils.pathConfig.browser;
};

DocUtils.escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

DocUtils.charMap = {
  '&': "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};

DocUtils.wordToUtf8 = function(string) {
  var endChar, startChar, _ref;
  _ref = DocUtils.charMap;
  for (endChar in _ref) {
    startChar = _ref[endChar];
    string = string.replace(new RegExp(DocUtils.escapeRegExp(startChar), "g"), endChar);
  }
  return string;
};

DocUtils.utf8ToWord = function(string) {
  var endChar, startChar, _ref;
  _ref = DocUtils.charMap;
  for (startChar in _ref) {
    endChar = _ref[startChar];
    string = string.replace(new RegExp(DocUtils.escapeRegExp(startChar), "g"), endChar);
  }
  return string;
};

DocUtils.defaultParser = function(tag) {
  return {
    'get': function(scope) {
      if (tag === '.') {
        return scope;
      } else {
        return scope[tag];
      }
    }
  };
};

DocUtils.loadDoc = function(path, options) {
  var async, basePath, callback, data, e, errorCallback, fileName, intelligentTagging, loadFile, noDocx, req, reqCallback, totalPath, urloptions;
  if (options == null) {
    options = {};
  }
  noDocx = options.docx != null ? !options.docx : false;
  async = options.async != null ? options.async : false;
  intelligentTagging = options.intelligentTagging != null ? options.intelligentTagging : false;
  callback = options.callback != null ? options.callback : null;
  basePath = "";
  if (path == null) {
    throw new Error('path not defined');
  }
  if (path.indexOf('/') !== -1) {
    totalPath = path;
    fileName = totalPath;
  } else {
    fileName = path;
    if (basePath === "" && (DocUtils.pathConfig != null)) {
      basePath = DocUtils.getPathConfig();
    }
    totalPath = basePath + path;
  }
  loadFile = function(data) {
    DocUtils.docXData[fileName] = data;
    if (noDocx === false) {
      DocUtils.docX[fileName] = new DocxGen(data, {}, {
        intelligentTagging: intelligentTagging
      });
      return DocUtils.docX[fileName];
    }
    if (callback != null) {
      return callback(DocUtils.docXData[fileName]);
    }
    if (async === false) {
      return DocUtils.docXData[fileName];
    }
  };
  if (DocUtils.env === 'browser') {
    return DocUtils.loadHttp(totalPath, function(err, result) {
      if (err) {
        console.error('error');
        if (callback != null) {
          callback(true);
        }
        return;
      }
      return loadFile(result);
    }, async);
  } else {
    if (path.indexOf("http") === 0) {
      urloptions = url.parse(path);
      options = {
        hostname: urloptions.hostname,
        path: urloptions.path,
        method: 'GET',
        rejectUnauthorized: false
      };
      errorCallback = function(e) {
        throw new Error("Error on HTTPS Call");
      };
      reqCallback = function(res) {
        var data;
        res.setEncoding('binary');
        data = "";
        res.on('data', function(chunk) {
          return data += chunk;
        });
        return res.on('end', function() {
          return loadFile(data);
        });
      };
      switch (urloptions.protocol) {
        case "https:":
          req = https.request(options, reqCallback).on('error', errorCallback);
          break;
        case 'http:':
          req = http.request(options, reqCallback).on('error', errorCallback);
      }
      return req.end();
    } else {
      if (async === true) {
        return fs.readFile(totalPath, "binary", function(err, data) {
          if (err) {
            if (callback != null) {
              return callback(err);
            }
          } else {
            return loadFile(data);
          }
        });
      } else {
        try {
          data = fs.readFileSync(totalPath, "binary");
          return loadFile(data);
        } catch (_error) {
          e = _error;
          if (callback != null) {
            return callback(e);
          }
        }
      }
    }
  }
};

DocUtils.loadHttp = function(result, callback, async) {
  var errorCallback, options, req, reqCallback, response, urloptions, xhrDoc;
  if (async == null) {
    async = false;
  }
  if (DocUtils.env === 'node') {
    urloptions = url.parse(result);
    options = {
      hostname: urloptions.hostname,
      path: urloptions.path,
      method: 'GET',
      rejectUnauthorized: false
    };
    errorCallback = function(e) {
      return callback(e);
    };
    reqCallback = function(res) {
      var data;
      res.setEncoding('binary');
      data = "";
      res.on('data', function(chunk) {
        return data += chunk;
      });
      return res.on('end', function() {
        return callback(null, data);
      });
    };
    switch (urloptions.protocol) {
      case "https:":
        req = https.request(options, reqCallback).on('error', errorCallback);
        break;
      case 'http:':
        req = http.request(options, reqCallback).on('error', errorCallback);
    }
    return req.end();
  } else {
    response = "";
    xhrDoc = new XMLHttpRequest();
    xhrDoc.open('GET', result, async);
    if (xhrDoc.overrideMimeType) {
      xhrDoc.overrideMimeType('text/plain; charset=x-user-defined');
    }
    xhrDoc.onreadystatechange = function(e) {
      if (this.readyState === 4) {
        if (this.status === 200) {
          response = this.response;
          return callback(null, this.response);
        } else {
          return callback(true);
        }
      }
    };
    xhrDoc.send();
    return response;
  }
};

DocUtils.unsecureQrCode = function(result, callback) {
  var defaultImageCreator;
  if (DocUtils.env === 'node') {
    console.error('Your are using an insecure qrcode image finder. With this function, a malicious user could read anyfile that is on the server where docxtemplater resides. The qrcode module now accepts a function as its first parameter instead of a bool see http://docxtemplater.readthedocs.org/en/latest/configuration.html#image-replacing');
  }
  if (result.substr(0, 5) === 'http:' || result.substr(0, 6) === 'https:') {
    return DocUtils.loadHttp(result, callback);
  } else if (result.substr(0, 4) === 'gen:') {
    defaultImageCreator = function(arg, callback) {
      var res;
      res = JSZip.base64.decode("iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAIAAABvSEP3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACXSURBVDhPtY7BDYAwDAMZhCf7b8YMxeCoatOQJhWc/KGxT2zlCyaWcz8Y+X7Bs1TFVJSwIHIYyFkQufWIRVX9cNJyW1QpEo4rixaEe7JuQagAUctb7ZFYFh5MVJPBe84CVBnB42//YsZRgKjFDBVg3cI9WbRwXLktQJX8cNIiFhM1ZuTWk7PIYSBhkVcLzwIiCjCxhCjlAkBqYnqFoQQ2AAAAAElFTkSuQmCC");
      return callback(null, res);
    };
    return defaultImageCreator(result, callback);
  } else if (result !== null && result !== void 0 && result.substr(0, 22) !== 'error decoding QR Code') {
    if (DocUtils.env === 'node') {
      return fs.readFile(DocUtils.getPathConfig() + result, callback);
    } else {
      return DocUtils.loadHttp(DocUtils.getPathConfig() + result, callback);
    }
  } else {
    return callback(new Error("Image undefined"));
  }
};

DocUtils.tags = {
  start: '{',
  end: '}'
};

DocUtils.clone = function(obj) {
  var flags, key, newInstance;
  if ((obj == null) || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof RegExp) {
    flags = '';
    if (obj.global != null) {
      flags += 'g';
    }
    if (obj.ignoreCase != null) {
      flags += 'i';
    }
    if (obj.multiline != null) {
      flags += 'm';
    }
    if (obj.sticky != null) {
      flags += 'y';
    }
    return new RegExp(obj.source, flags);
  }
  newInstance = new obj.constructor();
  for (key in obj) {
    newInstance[key] = DocUtils.clone(obj[key]);
  }
  return newInstance;
};

DocUtils.xml2Str = function(xmlNode) {
  var a;
  a = new XMLSerializer();
  return a.serializeToString(xmlNode);
};

DocUtils.Str2xml = function(str, errorHandler) {
  var parser, xmlDoc;
  parser = new DOMParser({
    errorHandler: errorHandler
  });
  return xmlDoc = parser.parseFromString(str, "text/xml");
};

DocUtils.replaceFirstFrom = function(string, search, replace, from) {
  return string.substr(0, from) + string.substr(from).replace(search, replace);
};

DocUtils.encode_utf8 = function(s) {
  return unescape(encodeURIComponent(s));
};

DocUtils.convert_spaces = function(s) {
  return s.replace(new RegExp(String.fromCharCode(160), "g"), " ");
};

DocUtils.decode_utf8 = function(s) {
  var e;
  try {
    if (s === void 0) {
      return void 0;
    }
    return decodeURIComponent(escape(DocUtils.convert_spaces(s)));
  } catch (_error) {
    e = _error;
    console.error(s);
    console.error('could not decode');
    throw new Error('end');
  }
};

DocUtils.base64encode = function(b) {
  return btoa(unescape(encodeURIComponent(b)));
};

DocUtils.preg_match_all = function(regex, content) {

  /*regex is a string, content is the content. It returns an array of all matches with their offset, for example:
  	regex=la
  	content=lolalolilala
  	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
   */
  var matchArray, replacer;
  if (!(typeof regex === 'object')) {
    regex = new RegExp(regex, 'g');
  }
  matchArray = [];
  replacer = function() {
    var match, offset, pn, string, _i;
    match = arguments[0], pn = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), offset = arguments[_i++], string = arguments[_i++];
    pn.unshift(match);
    pn.offset = offset;
    return matchArray.push(pn);
  };
  content.replace(regex, replacer);
  return matchArray;
};

DocUtils.sizeOfObject = function(obj) {
  var key, log, size;
  size = 0;
  log = 0;
  for (key in obj) {
    size++;
  }
  return size;
};

DocUtils.maxArray = function(a) {
  return Math.max.apply(null, a);
};

DocUtils.getOuterXml = function(text, start, end, xmlTag) {
  var endTag, startTag;
  endTag = text.indexOf('</' + xmlTag + '>', end);
  if (endTag === -1) {
    throw new Error("can't find endTag " + endTag);
  }
  endTag += ('</' + xmlTag + '>').length;
  startTag = Math.max(text.lastIndexOf('<' + xmlTag + '>', start), text.lastIndexOf('<' + xmlTag + ' ', start));
  if (startTag === -1) {
    throw new Error("can't find startTag");
  }
  return {
    "text": text.substr(startTag, endTag - startTag),
    startTag: startTag,
    endTag: endTag
  };
};

module.exports = DocUtils;
