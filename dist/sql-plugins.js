'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sqlplugins = function () {
  function sqlplugins(connection) {
    _classCallCheck(this, sqlplugins);

    this.getInsertSQL = this.getInsertSQL.bind(this);
    this.getInsertSQLByReq = this.getInsertSQLByReq.bind(this);
    this.getUpdateSQL = this.getUpdateSQL.bind(this);
    this.getUpdateSQLByReq = this.getUpdateSQLByReq.bind(this);
    this.getFields = this.getFields.bind(this);
    this.connection = connection;
  }

  _createClass(sqlplugins, [{
    key: 'getFields',
    value: function getFields(table, callback) {
      var FieldRow = [];
      this.connection.query('SHOW FULL COLUMNS FROM ' + table, function (err, rows, fields) {
        if (err) {
          callback(err, null, null);
        } else {
          callback(err, rows, fields);
        }
      });
    }
  }, {
    key: 'queryInsert',
    value: function queryInsert(req, res) {
      var _this = this;

      var table = req.body.table;
      var rowobj = req.body.newFiledObj;

      var p1 = new Promise(function (resolve, reject) {
        var sql = '',
            resultObj = {};
        //取得該Table的Col
        _this.getFields(table, function (err, rows, fields) {
          var sql_key = void 0,
              sql_value = void 0;
          for (var key in rows) {
            var filedName = rows[key]['Field'];
            if (!rowobj.hasOwnProperty(filedName)) continue;

            var value = rowobj[filedName];

            sql_key = sql_key && sql_key + "," || "";
            sql_key += "`" + filedName + "`";
            sql_value = sql_value && sql_value + "," || "";

            if (value == 'null') {
              sql_value += value;
            } else if (value.length == 0) {
              if (rows[key]['Null'] == 'NO' && rows[key]['Extra'] != 'auto_increment') {
                res.json({ success: false, rows: rows[key], message: '欄位filedName是必填', error: { 'errno': '0', 'errmsg': '欄位' + filedName + '在資料庫顯示是必填欄位' } });
                reject();
              } else {
                sql_value += 'null';
              }
            } else {
              sql_value += "\'" + value + "\'";
            }

            if (rows[key]['Extra'] == 'auto_increment') {
              resultObj.autoIncrementField = rows[key]['Field'];
            }
          }
          sql = "INSERT INTO `" + table + "` (" + sql_key + ") VALUES (" + sql_value + ");";
          resultObj.sql = sql;
          resultObj.table = table;
          resolve(resultObj);
        });
      });

      p1.then(function (resultObj) {
        //console.log('63 '+sql);

        _this.connection.query(resultObj.sql, function (err, result) {
          if (err) {
            res.json({ success: false, message: '插入失敗', sql: resultObj.sql, error: err, resultObj: resultObj });
            //throw err;
          } else {
            /*
            result:{fieldCount: 0, affectedRows: 1, insertId: 454, serverStatus: 2, warningCount: 0, message: "",…}
            */
            // return the information including token as JSON
            // 若登入成功回傳一個 json 訊息
            res.json({
              success: true,
              message: 'Insert ok',
              result: result,
              autoIncrementField: resultObj.autoIncrementField,
              resultObj: resultObj
            });
          }
        });
      });
    }
  }, {
    key: 'getInsertSQLByReq',
    value: function getInsertSQLByReq(req) {
      var table = req.body.table;
      var rowobj = req.body.newFiledObj;
      return this.getInsertSQL(table, rowobj);
    }
  }, {
    key: 'getInsertSQL',
    value: function getInsertSQL(table, rowobj) {
      var sql_key = void 0,
          sql_value = void 0;

      for (var key in rowobj) {
        // skip loop if the property is from prototype
        if (!rowobj.hasOwnProperty(key)) continue;
        if (key == '_action') continue;
        var value = rowobj[key];

        sql_key = sql_key && sql_key + "," || "";
        sql_key += "`" + key + "`";
        sql_value = sql_value && sql_value + "," || "";

        if (value == 'null') {
          sql_value += value;
        } else if (value.length == 0) {
          sql_value += 'null';
        } else {
          sql_value += "\'" + value + "\'";
        }
      }
      var sql = "INSERT INTO `" + table + "` (" + sql_key + ") VALUES (" + sql_value + ");";

      return sql;
    }
  }, {
    key: 'queryUpdate',
    value: function queryUpdate(req, res) {
      var _this2 = this;

      var table = req.body.table;
      var updateRow = req.body.updateRow;
      var keyFiled = req.body.keyFiled;
      var whereStr = "`" + keyFiled + "` = \'" + updateRow[keyFiled] + "\'";

      var p1 = new Promise(function (resolve, reject) {
        var sql = '',
            resultObj = { 'fieleds': {} };
        //取得該Table的Col
        _this2.getFields(table, function (err, rows, fields) {
          var sql_key = '',
              sql_value = void 0;

          for (var key in rows) {
            var filedName = rows[key]['Field']; //資料庫有的欄位名稱
            if (!updateRow.hasOwnProperty(filedName)) continue;

            var value = updateRow[filedName];

            //////
            if (sql_key != '') {
              sql_key += ",";
            }

            if (value === null) {
              sql_key += "`" + filedName + "` = " + value;
            } else if (value.length == 0) {
              if (rows[key]['Null'] == 'NO') {
                res.json({ success: false, message: '欄位filedName是必填', error: { 'errno': '0', 'errmsg': '欄位' + filedName + '在資料庫顯示是必填欄位' } });
                reject();
              } else {
                sql_key += "`" + filedName + "` = null";
              }
            } else {

              sql_key += "`" + filedName + "` = \'" + value + "\'";
            }
          }
          sql = "UPDATE `" + table + "` SET " + sql_key + " WHERE " + whereStr;
          resultObj.sql = sql;
          resolve(resultObj);
        });
      });

      p1.then(function (resultObj) {
        //console.log('63 '+sql);

        _this2.connection.query(resultObj.sql, function (err, result) {
          if (err) {
            res.json({ success: false, message: '更新失敗', sql: resultObj.sql, error: err });
            //throw err;
          } else {
            // return the information including token as JSON
            // 若登入成功回傳一個 json 訊息
            res.json({
              success: true,
              message: 'Update ok',
              sql: resultObj.sql
            });
          }
        });
      });
    }
  }, {
    key: 'getUpdateSQLByReq',
    value: function getUpdateSQLByReq(req) {

      var table = req.body.table;
      var updateRow = req.body.updateRow;
      var keyFiled = req.body.keyFiled;
      var whereStr = "`" + keyFiled + "` = \'" + updateRow[keyFiled] + "\'";

      return this.getUpdateSQL(table, updateRow, whereStr);
    }
  }, {
    key: 'getUpdateSQL',
    value: function getUpdateSQL(table, rowobj) {
      var whereStr = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '1';


      var sql_key = void 0,
          sql_value = void 0;
      for (var key in rowobj) {
        // skip loop if the property is from prototype
        if (!rowobj.hasOwnProperty(key)) continue;
        var value = rowobj[key];
        //console.log(key+ "=>" + obj);
        sql_key = sql_key && sql_key + "," || "";

        if (value === null) {
          sql_key += "`" + key + "` = " + value;
        } else {
          sql_key += "`" + key + "` = \'" + value + "\'";
        }
      }

      var sql = "UPDATE `" + table + "` SET " + sql_key + " WHERE " + whereStr;
      return sql;
    }
  }]);

  return sqlplugins;
}();

exports.default = sqlplugins;