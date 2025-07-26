import { OkPacket } from "mysql2/promise";
import BaseModel from "./BaseModel";

export class Template extends BaseModel {
    constructor() {
        super();
    }

    async getTemplate() {
        return await this._executeQuery("select * from templates", [])
    }

    async createTemplate(fileName: any, template_cols: any, tableName: any) {
        return await this._executeQuery(`INSERT INTO templates (file_name, template_cols, tableName) VALUES  (?,?,?)`, [fileName, template_cols, tableName])
    }
    async getSingleTemplate(templateid: any) {
        return await this._executeQuery("select * from templates where id = ?", [templateid]);
    }

    async mapTemplate(mapped_cols: any, templateid: any) {
        return await this._executeQuery("update templates set  ? where  id = ?", [mapped_cols, templateid]);
    }

    async getTemplateCols(templateid: any) {
        return await this._executeQuery("select template_cols, tableName, mapped_cols, rules from templates where id = ?", [templateid]);
    }

    async getTableCols(tabelName: any) {
        return await this._executeQuery(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS  WHERE TABLE_NAME = N'${tabelName}' and DATA_TYPE != 'timestamp'`, [tabelName]);
    }

    async bulkInsert(tableName: string, data: any[], keys: { toString: () => string }) {
        return this._executeTransaction(async (connection) => {
            const query = `INSERT INTO ${tableName} (${keys.toString()}) VALUES ?`;
            return await connection.query(query, [data]);
        });
    }

    async bulkUpdate(tableName: string, data: any[], keys: string[], ids: any[]) {
        return this._executeTransaction(async (connection) => {
            const updateQuery = `UPDATE ${tableName} SET ${keys
                .map((key) => `${key} = ?`)
                .join(", ")} WHERE id = ?`;

            let changeCount = 0;

            for (let i = 0; i < data.length; i++) {
                const rowData = data[i];
                const id = ids[i];
                const [result] = await connection.query(updateQuery, [...rowData, id]) as OkPacket[];
                changeCount += result.affectedRows;
            }

            return changeCount;
        });
    }

    async createTemplateTable() {
        return await this._executeQuery(`
        CREATE TABLE if not exists templates (
            id int(11) NOT NULL AUTO_INCREMENT,
            file_name varchar(45) DEFAULT NULL,
            template_cols LONGTEXT DEFAULT NULL,
            mapped_cols text,
            tableName varchar(45) DEFAULT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
          `, []);
    }
}

