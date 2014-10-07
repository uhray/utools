(function() {

  var root = this,
      utools = {};

  // Export the Utools object for **Node.js**
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = utools;
    }
    exports.utools = utools;
  } else {
    root.utools = utools;
  }

  utools.VERSION = '0.0.1';

  // ==============================  METHODS  =================================

  utools.arg_array = function(args) {
    return Array.prototype.slice.call(args, 0);
  }

  utools.id = utools.identity = function(d) {
    return d;
  }

  utools.insert = function(arr, idx, val) {
    arr.splice(idx, 0, val);
  }

  utools.remove_idx = function(arr, idx) {
    arr.splice(idx, 1);
  }

  utools.filter = function(list, fn) {
    var i = 0;
    while(i < list.length) {
      if (fn(list[i])) i++;
      else utools.remove_idx(list, i)
    }
  }

  utools.find = function(list, val, fn) {
    var fn = fn || utools.identity;
    for(var i = 0; i < list.length; i++) {
      if (fn(list[i]) === val) return i;
    }
    return -1;
  };

  utools.find.get = function(list, val, fn) {
    var i = utools.find(list, val, fn);
    if (i >= 0) return list[i];
    return undefined;
  };

  utools.isin = function(list, val, fn) {
    return utools.find(list, val, fn) >= 0;
  };

  //returns a copy of an object
  utools.copy = function(_){
    return JSON.parse(JSON.stringify(_));
  };

  // Joins strings to create a file path
  utools.join = function() {
    var route = '';
    for (var i in arguments) {
      var n = String(arguments[i]);
      n = n.replace(/^\//, '');
      n = n.replace(/\/$/, ''); var slash = n.length ? '/' : '';
      route += slash + n
    };
    if (route == '') { route = '/'; };
    return route;
  };

  utools.forEach = function(d, fn) {
    for (var i in d) { fn(i, d[i]); };
  };

  utools.set = function() {
    var args = utools.arg_array(arguments),
        f = function(d, x) {
          var old = utools.get.apply(this, args)(d),
              last = args[args.length - 1];
          if (!d) return;
          args.forEach(function(x, idx) {
            if (idx == args.length - 1) return;
            d[x] = d[x] || {};
            d = d && d[x];
          });

          return {
            old: old,
            current: d[last] = x,
            change: !(x == old)
          }
        };

    return m(f);

    function m(f) {
      f.map = function(fn) {
        return m(function(d, x) { return f(d, fn(x)); })
      }
      return f;
    }
  }

  utools.get = function() {
    var args = utools.arg_array(arguments),
        f = function(d) {
          args.forEach(function(x) { d = d && d[x]; });
          return d;
        };

    function m(f) {
      f.or = function(x) { return m(function(d) { return f(d) || x; }); };
      f.map = function(fn) { return m(function(d) { return fn(f(d)); }); };

      return f;
    }

    return m(f);
  };

  utools.setget = function() {
  }
  utools.setget.prototype.set = function(key, val) {
    this.__vars = this.__vars || {};
    this.__vars[key] = val;
  }
  utools.setget.prototype.get = function(key) {
    this.__vars = this.__vars || {};
    return this.__vars[key];
  }

  utools.fluent = function() {
    var deps = utools.arg_array(arguments);

    fn.__fluent__ = true;
    return fn;

    function fn() {
      var _this;
      if (this.applied) {
        _this = this._this;
      } else {
        _this = {};
        _this._vars = {};
        _this._var = function(n, d) {
          _this._vars[n] = {
            value: d,
            pre: function(d) { return d; },
            post: Function()
          }
          _this[n] = function(x) {
            if (arguments.length == 0) return _this._vars[n].value;
            var old = _this._vars[n].value;
            _this._vars[n].value = _this._vars[n].pre(x, old);
            _this._vars[n].post(x, old);
            return _this;
          }

          StreamObject.prototype[n] = function() {
            this._cache.push({
              value: n,
              args: arguments
            });
            return this;
          }

          var ret = {};
          ret.pre = function(fn) {
            _this._vars[n].pre = fn;
            return ret;
          };
          ret.post = function(fn) {
            _this._vars[n].post = fn;
            return ret;
          }
          return ret;
        };
        _this.vars = function() {
          for (var i in arguments) {
            _this._var(arguments[i]);
          }
        }
        _this._function = function(n, fn) {
          var fn = fn || Function();
          _this[n] = function() {
            fn.apply(this, arguments);
            return _this;
          }

          StreamObject.prototype[n] = function() {
            this._cache.push({
              value: n,
              args: arguments
            });
            return this;
          }
        };

        _this.stream = function() {
          return new StreamObject();
        }

        function StreamObject() {
          var on_end = Function(),
              on_start = Function();
          this._cache = [];
          this.on = function(action, fn) {
            if (action == 'start') on_start = fn;
            else if (action == 'end') on_end = fn;
            return this;
          }
          this.go = function() {
            on_start.apply(_this, arguments);
            this._cache.forEach(function(d) {
              return _this[d.value].apply(_this, d.args);
            });
            on_end.apply(_this, arguments);
          }
          return this;
        }
      }

      var args = arguments;
      deps.forEach(function(d) {
        if (d.__fluent__) d.apply({ applied: true, _this: _this}, args);
        else d.apply(_this, args);
      });
      return _this;
    }

  }

  utools.uuid = function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
                 .toString(16)
                 .substring(1);
    };

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  }

  utools.merge = function(a, b) {
    for (var k in b) a[k] = b[k];
    return a;
  }

  // NOTE: Taken from underscore.js (http://underscorejs.org)
  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('utools', [], function() {
      return utools;
    });
  }

}).call(this);

