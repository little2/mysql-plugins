export default class sqlplugins  {

    constructor(connection) {
      this.getInsertSQL = this.getInsertSQL.bind(this);
      this.getInsertSQLByReq = this.getInsertSQLByReq.bind(this);
      this.getUpdateSQL = this.getUpdateSQL.bind(this);
      this.getUpdateSQLByReq=this.getUpdateSQLByReq.bind(this);
      this.getFields = this.getFields.bind(this);
      this.connection = connection;
    }

    getFields(table , callback)
    {
    	let FieldRow=[];
    	this.connection.query('SHOW FULL COLUMNS FROM '+table, function(err, rows, fields){
    		if(err)
    		{
    			callback(err,null , null);
    		}
    		else {
    			callback(err, rows, fields);
    		}
    	});
    }


    queryInsert(req,res) {
      let table=req.body.table;
      let rowobj=req.body.newFiledObj;

      const p1 = new Promise((resolve,reject)=>{
        let sql='', resultObj={};
        //取得該Table的Col
        this.getFields(table,function(err, rows, fields){
          let sql_key, sql_value;
          for(let key in rows)
          {
            let filedName = rows[key]['Field'];
            if (!rowobj.hasOwnProperty(filedName)) continue;


            let value = rowobj[filedName];

            sql_key = sql_key && (sql_key + ",") || "";
            sql_key += "`" + filedName + "`";
            sql_value = sql_value && (sql_value + ",") || "";

            if(value == 'null' )
            {
              sql_value +=  value  ;
            }
            else if(value.length==0)
            {
              if(rows[key]['Null']=='NO' && rows[key]['Extra']!='auto_increment')
              {
                res.json({ success: false, rows:rows[key],message: '欄位filedName是必填', error:{'errno':'0','errmsg':'欄位'+filedName+'在資料庫顯示是必填欄位'} });
                reject();
              }
              else {
                sql_value +=  'null'  ;
              }

            }
            else {
              sql_value += "\'" + value + "\'";
            }

            if(rows[key]['Extra']=='auto_increment')
            {
              resultObj.autoIncrementField=rows[key]['Field'];
            }

          }
          sql = "INSERT INTO `" + table + "` (" + sql_key + ") VALUES (" + sql_value + ");";
          resultObj.sql=sql;
          resultObj.table=table;
          resolve(resultObj);
        });
      })

      p1.then((resultObj)=>{
        //console.log('63 '+sql);

        this.connection.query(resultObj.sql,
  				function(err, result) {
  					if (err){
  						res.json({ success: false, message: '插入失敗' ,sql:resultObj.sql , error: err , resultObj:resultObj});
  						//throw err;
  					}
  					else
  					{
                /*
                result:{fieldCount: 0, affectedRows: 1, insertId: 454, serverStatus: 2, warningCount: 0, message: "",…}
                */
  							// return the information including token as JSON
  							// 若登入成功回傳一個 json 訊息
  							res.json({
  								success: true,
  								message: 'Insert ok',
                  result: result ,
                  autoIncrementField: resultObj.autoIncrementField,
                  resultObj:resultObj
  							});
  					}
  				}
  			);

      });

    }


    getInsertSQLByReq(req) {
      let table=req.body.table;
      let rowobj=req.body.newFiledObj;
      return this.getInsertSQL(table, rowobj);
    }


    getInsertSQL(table, rowobj) {
        let sql_key, sql_value;

        for (let key in rowobj) {
            // skip loop if the property is from prototype
            if (!rowobj.hasOwnProperty(key)) continue;
            if(key=='_action') continue;
            let value = rowobj[key];

            sql_key = sql_key && (sql_key + ",") || "";
            sql_key += "`" + key + "`";
            sql_value = sql_value && (sql_value + ",") || "";

            if(value == 'null' )
            {
              sql_value +=  value  ;
            }
            else if(value.length==0)
            {
              sql_value +=  'null'  ;
            }
            else {
              sql_value += "\'" + value + "\'";
            }
        }
        let sql = "INSERT INTO `" + table + "` (" + sql_key + ") VALUES (" + sql_value + ");";

        return sql;
    }


    queryUpdate(req,res) {
      let table=req.body.table;
      let updateRow=req.body.updateRow;
      let keyFiled=req.body.keyFiled;
      let whereStr= "`" + keyFiled + "` = \'" + updateRow[keyFiled] + "\'";

      const p1 = new Promise((resolve,reject)=>{
        let sql='', resultObj={'fieleds':{}};
        //取得該Table的Col
        this.getFields(table,function(err, rows, fields){
          let sql_key='', sql_value;

          for(let key in rows)
          {
            let filedName = rows[key]['Field']; //資料庫有的欄位名稱
            if (!updateRow.hasOwnProperty(filedName)) continue;

            let value = updateRow[filedName];


//////
            if(sql_key!='')
            {
              sql_key+= ",";
            }


            if(value===null)
            {
              sql_key += "`" + filedName + "` = "+ value ;
            }
            else if(value.length==0)
            {
              if(rows[key]['Null']=='NO')
              {
                res.json({ success: false, message: '欄位filedName是必填', error:{'errno':'0','errmsg':'欄位'+filedName+'在資料庫顯示是必填欄位'} });
                reject();
              }
              else {
                sql_key += "`" + filedName + "` = null";
              }
            }
            else {

              sql_key += "`" + filedName + "` = \'" + value + "\'";
            }

          }
          sql = "UPDATE `" + table + "` SET " + sql_key + " WHERE " + whereStr;
          resultObj.sql=sql;
          resolve(resultObj);
        });
      })

      p1.then((resultObj)=>{
        //console.log('63 '+sql);

        this.connection.query(resultObj.sql,
  				function(err, result) {
  					if (err){
  						res.json({ success: false, message: '更新失敗' ,sql:resultObj.sql , error: err});
  						//throw err;
  					}
  					else
  					{
  							// return the information including token as JSON
  							// 若登入成功回傳一個 json 訊息
  							res.json({
  								success: true,
  								message: 'Update ok',
                  sql:resultObj.sql
  							});
  					}
  				}
  			);

      });

    }


    getUpdateSQLByReq(req) {

      let table=req.body.table;
      let updateRow=req.body.updateRow;
      let keyFiled=req.body.keyFiled;
      let whereStr= "`" + keyFiled + "` = \'" + updateRow[keyFiled] + "\'";

      return this.getUpdateSQL(table, updateRow, whereStr);
    }

    getUpdateSQL(table, rowobj, whereStr='1') {

        let sql_key, sql_value;
        for (let key in rowobj) {
            // skip loop if the property is from prototype
            if (!rowobj.hasOwnProperty(key)) continue;
            let value = rowobj[key];
            //console.log(key+ "=>" + obj);
            sql_key = sql_key && (sql_key + ",") || "";


            if(value===null)
            {
              sql_key += "`" + key + "` = "+ value ;
            }
            else {
              sql_key += "`" + key + "` = \'" + value + "\'";
            }
        }

        const sql = "UPDATE `" + table + "` SET " + sql_key + " WHERE " + whereStr;
        return sql;
    }
}
