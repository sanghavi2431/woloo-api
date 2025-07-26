import mysql from "../utilities/mysql";
import { Connection } from "mysql2/promise";
import { dbLogger } from "../config/LOGGER";
import { performance } from "perf_hooks";

class BaseModel {
  constructor() {}

  async _executeQuery(query: string, params: Array<any>) {
    const startTime = performance.now();

    try {
      const result = await mysql.execute_query(query, params);
      const duration = performance.now() - startTime;

      dbLogger.log({
        level: "info",
        label: "DB_QUERY",
        message: `Query executed in ${duration.toFixed(2)}ms`,
        query,
        params,
        duration,
      });

      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;

      dbLogger.error({
        label: "DB_QUERY",
        message: `Query failed in ${duration.toFixed(2)}ms`,
        query,
        params,
        duration,
        error: error.message,
      });

      throw error;
    }
  }

  async _executeTransaction(callback: (connection: Connection) => Promise<any>) {
    const connection = await mysql.getConnection();

    try {
      await connection.beginTransaction(); // Start transaction
      const result = await callback(connection); // Perform operations
      
      await connection.commit(); // Commit if all succeed
      return result;
    } catch (error: any) {
      await connection.rollback(); // Rollback on error
      dbLogger.error({
        label: "DB_TRANSACTION",
        message: `Transaction rolled back due to error: ${error.message}`,
      });
      throw error;
    } finally {
      connection.end(); // Release connection
    }
  }
}

export default BaseModel;
