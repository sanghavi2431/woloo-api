import BaseModel from "./BaseModel";

export class ClientAuth extends BaseModel {
  constructor() {
    super();
  }

  async getClient(client_id: any, client_secret: any) {
    const result = await this._executeQuery(`SELECT * from clients where client_id = ? and client_secret = ?`, [client_id, client_secret]);
    return result[0];
  }
  
  async getClientById(client_id: any) {
    const result = await this._executeQuery(`SELECT * from clients where client_id = ?`, [client_id]);
    return result[0];
  }

  async registerClient(client_name: string, client_id: string, hashed_secret: string, gmaps_api_key_var: string) {
    const query = `INSERT INTO clients (client_name, client_id, client_secret, status, gmaps_api_key_var) VALUES (?, ?, ?, ?, ?)`;
    return await this._executeQuery(query, [client_name, client_id, hashed_secret, 1, gmaps_api_key_var]);
  }
}
