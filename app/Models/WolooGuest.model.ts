import BaseModel from "./BaseModel";
import Constants from "../Constants/common";
import common from "../Constants/common";

export class WolooGuestModel extends BaseModel {
  constructor() {
    super();
  }

  async getWolooGuest(
    pageSize: any,
    pageIndex: any,
    sortOrder: string,
    query: string
  ) {
    return await this._executeQuery(
      `SELECT u.id, u.role_id, u.name,u.email, u.remember_token, u.mobile, u.city, u.pincode, u.address, u.avatar, u.fb_id, 
      u.gp_id, u.ref_code, u.sponsor_id, u.woloo_id, u.subscription_id, u.expiry_date, u.voucher_id, u.gift_subscription_id,
      u.lat, u.lng, u.otp, u.status, u.settings, u.created_at, u.updated_at, u.deleted_at,u.gender,  u.is_first_session,u.dob, u.is_thirst_reminder, 
      u.is_blog_content_notification, u.aadhar_url,u.pan_url,u.state, u.alternate_mob
       FROM users as u ${query}
    ${sortOrder}   LIMIT ? OFFSET ?`,
      [pageSize, pageIndex]
    );
  }

  async getUserByMobileOrEmail(email: string, mobile: number) {
    let result = await this._executeQuery(
      `SELECT id FROM users WHERE email = '${email}' OR mobile = '${mobile}'`,
      []
    );
    return result;
  }

  async getUserByEmail(email: string) {
    let result = await this._executeQuery(
      `SELECT id FROM users WHERE email = '${email}'`,
      []
    );
    return result;
  }

  async isEmailExist(email: string, id: number) {
    let result = await this._executeQuery(
      `SELECT id FROM users WHERE email = '${email}'  and id != '${id}' `,
      []
    );
    return result;
  }

  async isHostExist(id: number) {
    let result = await this._executeQuery(
      `SELECT id FROM woloos WHERE  id = '${id}' `,
      []
    );
    return result;
  }

  async getHostUserByHostId(woloo_id: number) {
    let result = await this._executeQuery(
      `SELECT id FROM users WHERE woloo_id = '${woloo_id}'`,
      []
    );
    return result;
  }

  async isHostEmailExist(email: string, id: number) {
    let result = await this._executeQuery(
      `SELECT id FROM woloos WHERE email = '${email}' and id != '${id}' `,
      []
    );
    return result;
  }

  async isHostMobileExist(mobile: string, id: number) {
    let result = await this._executeQuery(
      `SELECT id FROM woloos WHERE mobile = '${mobile}' and id != '${id}' `,
      []
    );
    return result;
  }

  async insertUser(data: any) {
    let result = await this._executeQuery(`INSERT INTO users SET ?`, [data]);
    return result;
  }

  async getUserByMobile(mobile: any) {
    return await this._executeQuery(`SELECT * FROM users WHERE mobile = ?`, [
      mobile,
    ]);
  }

  async purchasedBy(id: number, subScriptionId: number) {
    return await this._executeQuery(
      `SELECT purchased_by FROM user_subscriptions WHERE user_id = ? and subscription_id=? ORDER BY id desc limit 1`,
      [id, subScriptionId]
    );
  }

  async createUser(data: any) {
    return await this._executeQuery(`INSERT INTO users SET ?`, [data]);
  }

  async createWallet(data: any) {
    return await this._executeQuery(`INSERT INTO wallets SET ?`, [data]);
  }

  async createRZP(data: any) {
    return await this._executeQuery(`INSERT INTO user_razopay SET ?`, [data]);
  }

  async getWolooGuestCount(query: any) {
    return await this._executeQuery(
      `SELECT  COUNT(id) as count  FROM users  ${query}`,
      []
    );
  }

  async updateUser(sender: string, userId: number) {
    return await this._executeQuery(`update users set name=?  where id=?`, [
      sender,
      userId,
    ]);
  }

  async getGiftSubscriptionId() {
    return await this._executeQuery(
      `SELECT value FROM settings s where s.key="site.gift_subscription_id"`,
      []
    );
  }
  async getSmsApi() {
    return await this._executeQuery(
      `SELECT value from settings s where s.key="site.sms_api"`,
      []
    );
  }

  async getMessage() {
    return await this._executeQuery(
      `SELECT value from settings s where s.key="site.sms_woloo_rating_template"`,
      []
    );
  }

  async getAddWolooMsg() {
    return await this._executeQuery(
      `SELECT value from settings s where s.key="site.sms_add_woloo_template"`,
      []
    );
  }

  async getAddUserMsg() {
    return await this._executeQuery(
      `SELECT value from settings s where s.key="site.sms_registration_template"`,
      []
    );
  }

  async UserWolooRating(wolooId: number) {
    return await this._executeQuery(
      `SELECT AVG(rating) AS average_rating
      FROM user_woloo_ratings
      WHERE woloo_id =? AND status = 1;`,
      [wolooId]
    );
  }
  async fetchUserSubscription(userId: any, status: number) {
    try {
      let result = await this._executeQuery(
        "SELECT * FROM user_subscriptions where user_id=? and status=? order by created_at",
        [userId, status]
      );

      return result;
    } catch (e) {
      throw "SQL error";
    }
  }
  async fetchSubscriptionIdByVoucherId(id: any) {
    return await this._executeQuery(
      `SELECT subscriptions_id  FROM voucher_codes where id=? `,
      [id]
    );
  }

  async findSubscriptionBySubId(id: any) {
    return await this._executeQuery(
      `SELECT * FROM subscriptions where id = ? `,
      [id]
    );
  }

  async getOtpExpiryFromSettings() {
    return await this._executeQuery(
      `SELECT value from settings s where s.key="site.otp_expiry_in_minutes"`,
      []
    );
  }

  async getFreeTrialPeriodDays() {
    return await this._executeQuery(
      `SELECT * FROM settings As s where s.key = ? `,
      ["site.free_trial_period_days"]
    );
  }

  async fetchTotalCoins(id: any) {
    return await this._executeQuery(
      `SELECT value , type FROM wallets where transaction_type="CR"and  is_expired<>1 and user_id=?`,
      [id]
    );
  }

  async getUserByID(id: any) {
    return (await this._executeQuery(`SELECT * from users where  id = ? `, [id]))[0];
  }

  async getWolooHostByWolooId(wolooId: any) {
    return await this._executeQuery(
      `SELECT id as host_user_id,role_id, woloo_id from users where  woloo_id = ? `,
      [wolooId]
    );
  }

  async fetchUserByID(id: any) {
    let result = await this._executeQuery(`SELECT * from users where id=?`, [
      id,
    ]);
    return result[0];
  }

  async fetchOfferDetails(id: any) {
    return await this._executeQuery(
      `SELECT uo.offer_id, o.title , o.description,o.image , o.end_date FROM user_offers as uo
    left join offers as o
    ON uo.offer_id = o.id where uo.user_id=? and o.end_date >= current_date()`,
      [id]
    );
  }

  async getSponsorId(refCode: any) {
    return await this._executeQuery(
      `SELECT sponsor_id  FROM users u where u.ref_code= "${refCode}" `,
      []
    );
  }
  async getWolooGuestById(id: number) {
    return await this._executeQuery(
      `select u.id, u.role_id, u.name,u.email,u.shop_password, u.remember_token, u.mobile, u.city, u.pincode, u.address, u.avatar, u.fb_id, 
      u.gp_id, u.ref_code, u.sponsor_id, u.woloo_id, u.subscription_id, u.expiry_date, u.voucher_id, u.gift_subscription_id,
      u.lat, u.lng, u.otp, u.status, u.settings, u.created_at, u.updated_at, u.deleted_at,u.gender,  u.is_first_session,u.dob, u.is_thirst_reminder, u.IsVtionUser, 
     u.thirst_reminder_hours, u.is_blog_content_notification, u.aadhar_url,u.pan_url,u.state, u.alternate_mob,u.isRegister, DATE_FORMAT(dob,'%Y-%m-%d') as dob from users as u where id = ?`,
      [id]
    );
  }

  async getWolooGuestByMobile(mobile: number) {
    return await this._executeQuery(
      `Select u.id, u.role_id,u.shop_password, u.name,u.email, u.remember_token, u.mobile, u.city, u.pincode, u.address, u.avatar, u.fb_id, 
    u.gp_id, u.ref_code, u.sponsor_id, u.woloo_id, u.subscription_id, u.expiry_date, u.voucher_id, u.gift_subscription_id,
    u.lat, u.lng, u.otp, u.status, u.settings, u.created_at, u.updated_at, u.deleted_at,u.gender,  u.is_first_session,u.dob, u.is_thirst_reminder, 
   u.thirst_reminder_hours, u.is_blog_content_notification, u.aadhar_url,u.pan_url,u.state, u.alternate_mob, DATE_FORMAT(dob,'%Y-%m-%d') as dob from users as u where mobile = ?`,
      [mobile]
    );
  }

  async createWolooGuest(wolooUsers: any) {
    return await this._executeQuery("insert into users set ?", [wolooUsers]);
  }

  async updateWolooGuest(data: any, id: number) {
    return await this._executeQuery("update users set ? where id = ? ", [
      data,
      id,
    ]);
  }

  async deleteWolooGuestById(id: any) {
    return await this._executeQuery("update users set status= 0 WHERE id = ?", [
      id,
    ]);
  }
  async isDeviceExists(deviceSerial: any) {
    return await this._executeQuery(
      `SELECT * FROM device_details 
    WHERE device_serial = "${deviceSerial}"
    ORDER BY created_at DESC
    LIMIT 1`,
      []
    );
  }
  async insertDeviceDetails(isDeviceExists: any) {
    return await this._executeQuery("insert into device_details set ?", [
      isDeviceExists,
    ]);
  }
  async updateDeviceDetails(isDeviceExists: any, id: number) {
    return await this._executeQuery(
      "update device_details  set ? WHERE id = ?",
      [isDeviceExists, id]
    );
  }
  async getConfiguration(packageName: any) {
    return await this._executeQuery(
      "select * from configurations WHERE package_name = ?",
      [packageName]
    );
  }

  async getUser(data: any) {
    return await this._executeQuery(
      "select us.id,us.name, us.role_id,us.email,us.mobile,us.password,us.pincode,us.city,us.address,r.rolesAccess,r.permissions from users as us left join roles as r on us.role_id=r.id where us.email =?",
      [data.email]
    );
  }
async getUserByIdForClient(data: any) {
    return await this._executeQuery(
      `select us.id,us.name, us.role_id,us.email,us.mobile,us.shop_password,us.isRegister,us.pincode,us.city,us.address,us.woloo_id,w.name as facility_name,w.address as facility_address, 
      case when w.restaurant = 1 
		  then 'Restaurant' else 3 
      end as facility_type,r.rolesAccess,r.permissions from users as us 
      left join roles as r on us.role_id=r.id 
      left join woloos as w on us.woloo_id = w.id
      where us.id =?`,
      [data.id]
    );
  }
  async getUserByMobileNumber(data: any) {
    return await this._executeQuery(
      "select us.id,us.name, us.role_id,us.email,r.rolesAccess,r.permissions from users as us left join roles as r on us.role_id=r.id where us.mobile =?",
      [data.mobileNumber]
    );
  }

  async checkEmail(email: any) {
    return await this._executeQuery(
      "select u.email from users as u where email =?",
      [email]
    );
  }

  async isFutureSubcriptionExist(id: any) {
    return await this._executeQuery(
      "select created_at,subscription_id from user_subscriptions where user_id =?",
      [id]
    );
  }

  async checkIsLifeTimeFree(voucher_id: any) {
    return await this._executeQuery(
      "select lifetime_free from voucher_codes where id =?",
      [voucher_id]
    );
  }

  async fetchWolooGuestProfile(id: number) {
    return await this._executeQuery(
      `select u.id, u.role_id, u.name,u.email, u.remember_token, u.mobile, u.city, u.pincode, u.address, u.avatar, u.fb_id, 
    u.gp_id, u.ref_code, u.sponsor_id, u.woloo_id, u.subscription_id, u.expiry_date, u.voucher_id, u.gift_subscription_id,
    u.lat, u.lng, u.otp, u.status, u.settings, u.created_at, u.updated_at, u.deleted_at,u.gender,  u.is_first_session,u.dob, u.is_thirst_reminder, 
   u.thirst_reminder_hours, u.is_blog_content_notification, u.aadhar_url,u.pan_url,u.state, u.alternate_mob, DATE_FORMAT(dob,'%Y-%m-%d') as dob from users as u where id = ?`,
      [id]
    );
  }

  async fetchTransactionDetails(id: number) {
    return await this._executeQuery(
      "select user_id  from users  where id = ?",
      [id]
    );
  }

  async deleteWolooGuestByMultiId(id: any) {
    return await this._executeQuery(
      "UPDATE users SET status = 0  WHERE  ID IN (?)",
      [id]
    );
  }

  async getSettings(key: any) {
    return await this._executeQuery(
      `select * from settings WHERE settings.key = ?`,
      [key]
    );
  }

  async currenltyLinkVoucher(guestId: number) {
    return await this._executeQuery(
      `SELECT u.id, u.aadhar_url as aadhaar_url, u.pan_url, u.voucher_id, s.id as subscriptions_id, s.is_insurance_available FROM users u 
      left join voucher_codes v on u.voucher_id = v.id
      left join subscriptions s on u.subscription_id = s.id
      where u.id = ?`,
      [guestId]
    );
  }

  async giftCoinsData(Id: number) {
    return await this._executeQuery(
      `SELECT SUM(CASE WHEN w.transaction_type= "CR" THEN w.value END) as Credit,
      SUM(CASE WHEN w.transaction_type = "DR" THEN w.value END) as Debit from wallets w 
        where  w.is_gift="1" and  w.user_id = ?`,
      [Id]
    );
  }

  async findsubscription(userId: any, status: any) {
    return await this._executeQuery(
      `SELECT * from  user_subscriptions
        where user_id=? and  status = ?`,
      [userId, status]
    );
  }

  async CoinsData(Id: number) {
    return await this._executeQuery(
      `SELECT SUM(CASE WHEN w.transaction_type= "CR" THEN w.value END) as Credit,
      SUM(CASE WHEN w.transaction_type = "DR" THEN w.value END) as Debit from wallets w 
        where  w.is_gift="0" and  w.user_id = ?`,
      [Id]
    );
  }

  async getHistory(Id: number, pageSize: any, pageIndex: any) {
    return await this._executeQuery(
      `SELECT 
    w.id, 
    w.user_id, 
    w.blog_id, 
    w.woloo_id, 
    w.transaction_type, 
    w.remarks, 
    w.value, 
    w.type, 
    w.status, 
    w.is_expired,
    w.is_gift, 
    w.expired_on, 
    w.created_at, 
    w.updated_at, 
    w.sender_receiver_id, 
    w.message,
    ww.id AS woloo_id, 
    ww.code AS woloo_code, 
    ww.name AS woloo_name,
    ww.title AS woloo_title,
    ww.image AS woloo_image,
    ww.restaurant AS woloo_restaurant,
    ww.city AS woloo_city,
    us.id AS sender_id, 
    us.name AS sender_name, 
    us.email AS sender_email, 
    us.mobile AS sender_mobile
FROM 
    wallets w
LEFT JOIN 
    woloos ww ON w.woloo_id = ww.id
LEFT JOIN 
    users us ON w.sender_receiver_id = us.id
WHERE 
    w.user_id = ? 
LIMIT ? OFFSET ?;
`,
      [Id, pageSize, pageIndex]
    );
  }

  async getCoinHistoryCount(Id: number) {
    return await this._executeQuery(
      `SELECT COUNT(*) as count from wallets where user_id=?`,
      [Id]
    );
  }
  async getUsersWolooRating(
    pageSize: any,
    pageIndex: any,
    sortOrder: string,
    query: string
  ) {
    return await this._executeQuery(
      `select
uwr.id,
us.name as user_name,
w.name as woloo_name,
DATE_FORMAT(uwr.created_at,
'%d %b %y %h:%i:%s %p') as date,
uwr.rating,
uwr.remarks,
uwr.review_description
from
user_woloo_ratings as uwr
left join users as us on
uwr.user_id = us.id
left join woloos as w on
uwr.woloo_id = w.id 
    ${query} ${sortOrder}
limit ? offset ?`,
      [pageSize, pageIndex]
    );
  }
  async getUsersWolooRatingCount(query: string) {
    return await this._executeQuery(
      `SELECT COUNT(uwr.id) as count FROM user_woloo_ratings as uwr 
      left join users as us on uwr.user_id=us.id 
      left join woloos as w on uwr.woloo_id=w.id 
      ${query}`,
      []
    );
  }
  async thirstReminder(
    Id: number,
    is_thirst_reminder: number,
    thirst_reminder_hours: number
  ) {
    return await this._executeQuery(
      `UPDATE users SET is_thirst_reminder=? ,thirst_reminder_hours=? where Id=?`,
      [is_thirst_reminder, thirst_reminder_hours, Id]
    );
  }
  async getThirstReminderById(Id: number) {
    return await this._executeQuery(
      `SELECT is_thirst_reminder,thirst_reminder_hours FROM users where id=?`,
      [Id]
    );
  }
  async createNewPeriod(Data: any) {
    return await this._executeQuery(`Insert into  period_trackers set ? `, [
      Data,
    ]);
  }
  async updatePeriod(Data: any, Id: number) {
    return await this._executeQuery(
      `UPDATE period_trackers set ? where user_id=? `,
      [Data, Id]
    );
  }

  async getPeriodTrackerById(Id: number) {
    return await this._executeQuery(
      `SELECT * FROM period_trackers where user_id=? order by created_at desc limit 1`,
      [Id]
    );
  }
  async getUsersReport(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    query = "",
    isPaginated = false,
  ) {
    const limitOffsetClause = isPaginated ? "LIMIT ? OFFSET ?" : "";
    const queryParameters = isPaginated ? [pageSize, pageIndex] : [];
    const sql = `
      SELECT 
        u.id,
        u.created_at AS date_of_registration,
        u.name AS customer_name,
        u.address,
        u.city,
        u.pincode,
        u.mobile,
        u.email,
        u.ref_code AS unique_customer_code,
        u.expiry_date,
        CASE
          WHEN u.subscription_id IS NULL AND u.voucher_id IS NULL AND u.expiry_date IS NOT NULL THEN "${Constants.voucher.FREE}"
          WHEN u.subscription_id IS NOT NULL AND u.expiry_date IS NOT NULL THEN "${Constants.voucher.SUBSCRIPTION}"
          WHEN u.voucher_id IS NOT NULL AND u.expiry_date IS NOT NULL THEN "${Constants.voucher.VOUCHER}"
          ELSE ''
        END AS Subscription_type,
        CASE
          WHEN u.expiry_date >= CURRENT_DATE() THEN 'Active'
          ELSE 'Expired'
        END AS Subscription_status
      FROM users u
      ${query} 
      ${sortOrder} 
      ${limitOffsetClause}
    `;
    return this._executeQuery(sql, queryParameters);
  }

  async giftVoucher(
    pageSize: any,
    pageIndex: any,
    sortOrder: string,
    query: string
  ) {
    return await this._executeQuery(
      `SELECT u.id,u.created_at as date_of_Registration,u.name as customer_name, u.address, u.city, u.pincode, u.mobile, u.email, u.ref_code as unique_customer_code,  CASE
      WHEN u.subscription_id IS NULL AND u.voucher_id IS NULL AND u.expiry_date IS NOT NULL  THEN 'Free Trial'
      WHEN u.subscription_id IS NOT NULL AND u.expiry_date IS NOT NULL THEN 'Subscription'
      WHEN u.voucher_id IS NOT NULL AND u.expiry_date IS NOT NULL THEN 'Voucher'
      ELSE ''
    END AS Subscription_type, CASE
    WHEN  u.expiry_date >= CURRENT_DATE() THEN 'Active'
    ELSE 'Inactive'
    END AS Subscription_status
    FROM
    users u ${query} ${sortOrder} LIMIT ? OFFSET ?`,
      [pageSize, pageIndex]
    );
  }

  async giftVoucherCount(query: any) {
    return await this._executeQuery(
      `SELECT COUNT(id) as count FROM users u ${query}`,
      []
    );
  }

  async userReportVoucher(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    query = "",
    isPaginated = false,
  ) {
    const paginationClause = isPaginated ? "LIMIT ? OFFSET ?" : "";
    const queryParameters = isPaginated ? [pageSize, pageIndex] : [];

    const sqlQuery = `
      SELECT 
        u.id AS user_id,
        u.voucher_id,
        u.name AS customer_name,
        u.address,
        u.city,
        u.pincode,
        u.mobile,
        u.ref_code AS unique_customer_code,
        u.expiry_date,
        uvc.created_at AS applied_date,
        vc.type_of_voucher AS type,
        vc.corporate_id,
        CASE
          WHEN u.expiry_date >= CURRENT_DATE() THEN 'Active'
          ELSE 'Expired'
        END AS status
      FROM voucher_codes AS vc
      RIGHT JOIN users AS u 
        ON u.voucher_id = vc.id  
      LEFT JOIN user_voucher_code AS uvc 
        ON vc.id = uvc.voucher_code_id
      ${query}
      ${sortOrder}
      ${paginationClause}
    `;

    return this._executeQuery(sqlQuery, queryParameters);
  }

  async userReportSubscription(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    query = "",
    isPaginated = false,
  ) {
    const paginationClause = isPaginated ? "LIMIT ? OFFSET ?" : "";
    const queryParameters = isPaginated ? [pageSize, pageIndex] : [];

    const sqlQuery = `
     SELECT 
  u.id AS user_id,
  u.voucher_id,
  u.name AS customer_name,
  u.address,
  u.city,
  u.pincode,
  u.mobile,
  u.ref_code AS unique_customer_code, 
  MAX(us.payment_id) AS trx_no,  -- Use MAX for aggregation
  MAX(us.created_at) AS purchase_date,  -- Use MAX for aggregation
  MAX(s.price + (s.price * 18 / 100)) AS amount_paid, -- Use MAX for aggregation
  MAX(s.name) AS type, -- Use MAX for aggregation
  u.expiry_date,
  CASE
    WHEN u.expiry_date >= CURRENT_DATE() THEN 'Active'
    ELSE 'Expired'
  END AS status,
  CASE
    WHEN (u.aadhar_url IS NULL OR u.pan_url IS NULL OR u.aadhar_url = '' OR u.pan_url = '') THEN 'No'
    ELSE 'Yes'
  END AS is_document_uploaded,
  CASE
    WHEN MAX(s.is_insurance_available) = 1 THEN 'Yes'
    ELSE 'No'
  END AS is_insurance_available
FROM users AS u
LEFT JOIN user_subscriptions AS us 
  ON u.id = us.user_id 
  AND us.id = (
    SELECT MAX(id) 
    FROM user_subscriptions 
    WHERE user_id = us.user_id
  )
LEFT JOIN transaction_details AS t 
  ON us.payment_id = t.id
LEFT JOIN subscriptions AS s 
  ON u.subscription_id = s.id
${query}
GROUP BY u.id
${sortOrder.replace("us.id", "MAX(us.id)")} 
${paginationClause}
    `;

    return this._executeQuery(sqlQuery, queryParameters);
  }

  async ownerWiseHistory(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    isPaginated = false,
    query = "",
  ) {
    const limitOffsetClause = isPaginated ? "LIMIT ? OFFSET ?" : "";
    const queryParameters = isPaginated ? [pageSize, pageIndex] : [];

    const sql = `
      SELECT 
        u.id,
        u.name AS customer_name,
        u.address,
        u.city,
        u.email,
        u.mobile,
        u.pincode,
        u.sponsor_id,
        u.ref_code,
        CASE
          WHEN u.expiry_date >= CURDATE() THEN 'Active'
          ELSE 'Inactive'
        END AS Subscription_status,
        host.name AS owner_name
      FROM users AS u
      LEFT JOIN users AS host ON host.id = u.sponsor_id
      INNER JOIN users AS wp ON wp.id = u.sponsor_id AND wp.role_id = 9
      ${query}
      ${sortOrder}
      ${limitOffsetClause}
    `;

    return this._executeQuery(sql, queryParameters);
  }

  async userReportSubscriptionCount(query: any) {
    return await this._executeQuery(
      `SELECT u.id as user_id,u.voucher_id, u.name as customer_name, u.address, u.city, u.pincode, u.mobile, u.ref_code as unique_customer_code, 
      us.payment_id as trx_no,  s.created_at as purchase_date,  (s.price + (s.price * 18 / 100)) AS amount_paid, s.name as type,
      u.expiry_date,CASE
  WHEN  u.expiry_date >= CURRENT_DATE() THEN 'Active'
ELSE 'Inactive'
END AS status,
CASE
  WHEN (u.aadhar_url IS NULL AND u.pan_url IS  NULL  ||  u.aadhar_url ="" AND u.pan_url ="") THEN 'No'
ELSE 'Yes'
END AS is_document_uploaded,
CASE
WHEN s.is_insurance_available = 1 THEN 'Yes'
ELSE 'No'
END AS is_insurance_available
FROM user_subscriptions us right join users  as u ON u.id= us.user_id  and us.id = (Select MAX(id) from user_subscriptions where
 user_id = us.user_id)
LEFT JOIN transaction_details as t ON us.payment_id=t.id 
LEFT JOIN subscriptions as s ON u.subscription_id =s.id ${query}
`,
      []
    );
  }

  async userReportVoucherCount(query: any) {
    return await this._executeQuery(
      `SELECT u.id as user_id,u.voucher_id, u.name as customer_name, u.address, u.city, u.pincode, u.mobile, u.ref_code as unique_customer_code, 
      u.expiry_date,uvc.created_at as applied_date, vc.type_of_voucher as type, vc.corporate_id,   CASE
 WHEN  u.expiry_date >= CURRENT_DATE() THEN 'Active'
ELSE 'Inactive'
END AS status
FROM voucher_codes vc right join users  as u ON u.voucher_id= vc.id  
LEFT JOIN user_voucher_code  as uvc ON vc.id =uvc.voucher_code_id ${query}
`,
      []
    );
  }

  async istoryCount(query: any) {
    return await this._executeQuery(
      `SELECT COUNT(id) as count FROM users u WHERE true ${query}`,
      []
    );
  }

  async ownerWiseHistoryCount(query: any) {
    return await this._executeQuery(
      `Select u.id, u.name, u.mobile, u.sponsor_id, host.name as 'owner_name' from users as u
      left join users as host on host.id = u.sponsor_id
   
      where u.sponsor_id in (SELECT wp.id FROM users as wp WHERE wp.role_id=9)

       ${query} `,

      []
    );
  }

  async getUsersReportCount(query: any) {
    return await this._executeQuery(
      `SELECT COUNT(id) as count FROM users u ${query}`,
      []
    );
  }

  async getInitialCountbyUser(
    pageSize: any,
    sortOrder: string,
    query: string,
    isPaginated: boolean
  ) {
    let append = isPaginated ? " LIMIT ?" : "";
    let value = isPaginated ? [pageSize] : [];
    return await this._executeQuery(
      `SELECT (SUM(CASE WHEN ww.transaction_type = 'CR' THEN value ELSE 0 END) - SUM(CASE WHEN ww.transaction_type = 'DR' THEN value ELSE 0 END)) AS sumdata FROM (SELECT us.name, us.ref_code, w.type, w.transaction_type, w.value, w.created_at, w.id, us.pincode, 
        CASE WHEN w.transaction_type = 'CR' THEN w.value ELSE 0 END AS cr_sum,
         CASE WHEN w.transaction_type = 'DR' THEN w.value ELSE 0 END AS dr_sum 
         FROM wallets AS w 
         LEFT JOIN users AS us ON w.user_id = us.id
        ${query} ${sortOrder} ${append}) as ww`,
      value
    );
  }

  async getInitialCount(limit: any, isPaginated: boolean) {
    var append = isPaginated ? "LIMIT  ? " : "";
    let values = isPaginated ? [limit] : [];
    return await this._executeQuery(
      `select (sum(ww.cr_sum )-sum(ww.dr_sum)) as count from(SELECT 
        us.name,
        -- us.ref_code,
        -- w.type,
        w.transaction_type,
        w.value,
       -- w.created_at,
       -- w.id,
        us.pincode,
        IFNULL(cr_sum.sum, 0) AS cr_sum,
        IFNULL(dr_sum.sum, 0) AS dr_sum,
        cumulative_sum.value1
    FROM
        wallets AS w
            LEFT JOIN
        users AS us ON w.user_id = us.id
            LEFT JOIN
        (SELECT 
            user_id, transaction_type, SUM(value) AS sum
        FROM
            wallets
        WHERE
            transaction_type = 'CR'
        GROUP BY user_id) AS cr_sum ON cr_sum.user_id = w.user_id
            LEFT JOIN
        (SELECT 
            user_id, transaction_type, SUM(value) AS sum
        FROM
            wallets
        WHERE
            transaction_type = 'DR'
        GROUP BY user_id) AS dr_sum ON dr_sum.user_id = w.user_id
        LEFT JOIN	
        (SELECT id,SUM(value) as value1
                FROM wallets) AS cumulative_sum ON cumulative_sum.id = w.id and cumulative_sum.id < w.id
                where w.is_gift = "0" 
    GROUP BY us.id order by w.id desc ${append}) as ww `,
      values
    );
  }

  async customerHistory(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    query = "",
    isPaginated = false,
    roleId: any,
  ) {
    const limitOffsetClause = isPaginated ? "LIMIT ? OFFSET ?" : "";
    const queryParameters = isPaginated ? [pageSize, pageIndex] : [];

    const isAdminRole = common.rbac.role_id.admin === roleId;

    const baseQuery = `
      SELECT 
        ${isAdminRole ? `us.id AS user_id, 
          CASE 
            WHEN us.woloo_id IS NOT NULL THEN 'Host' 
            ELSE 'End User' 
          END AS customer_type,
          us.name, 
          us.ref_code,` : ""}
        w.type,
        w.transaction_type,
        w.value,
        w.created_at,
        w.id,
        us.pincode
        ${isAdminRole ? ", us.woloo_id" : ""}
      FROM wallets AS w
      LEFT JOIN users AS us ON w.user_id = us.id
      ${query}
      ${sortOrder}
      ${limitOffsetClause}
    `;

    return this._executeQuery(baseQuery, queryParameters);
  }

  async customerHistoryById(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    query = "",
    roleId: any,
  ) {
    const isAdminRole = common.rbac.role_id.admin === roleId;

    const baseQuery = `
      SELECT 
        ${isAdminRole ? "us.name, us.ref_code," : ""}
        w.type,
        w.transaction_type,
        w.value,
        w.created_at,
        w.id,
        us.pincode,
        CASE 
          WHEN w.transaction_type = 'CR' THEN w.value 
          ELSE 0 
        END AS cr_sum,
        CASE 
          WHEN w.transaction_type = 'DR' THEN w.value 
          ELSE 0 
        END AS dr_sum
      FROM wallets AS w
      LEFT JOIN users AS us ON w.user_id = us.id
      ${query}
      ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    return this._executeQuery(baseQuery, [pageSize, pageIndex]);
  }

  async customerHistoryCount(query: string) {
    return await this._executeQuery(
      `SELECT  COUNT(distinct us.id) as count FROM wallets as w left join users as us on w.user_id =us.id  ${query}  `,
      []
    );
  }
  async getPointsSource(query: string) {
    return await this._executeQuery(
      `SELECT distinct type FROM wallets  ${query} `,
      []
    );
  }
  async getTotalCoinsForUser(userId: number, transactionTimeStamp: string) {
    return await this._executeQuery(
      `SELECT SUM(CASE WHEN transaction_type = 'CR' THEN value ELSE -value END) AS total_coins 
      FROM wallets 
      WHERE user_id = ? AND is_gift="0" AND created_at <= ?
      AND transaction_type IN ('CR', 'DR')`,
      [userId, transactionTimeStamp]
    );
  }
  async getUsers() {
    return await this._executeQuery(
      `select concat(name," (",mobile,")") as users_name,id as user_id from users  `,
      []
    );
  }
  async getCorporate() {
    return await this._executeQuery(
      `select concat(name," (",id,")") as corporate_name,id from corporates  `,
      []
    );
  }
  async myOffers(userId: number) {
    // return await this._executeQuery(
    //   `SELECT  uo.*,w.rating,w.id as woloo_id,o.* FROM offers o
    // LEFT JOIN user_offers uo ON  o.id =uo.offer_id
    // LEFT JOIN woloos w ON  w.id =o.woloo_id
    //  WHERE o.end_date <= CURDATE()
    //  AND uo.user_id =${userId}`,
    // []
    // );
    return await this._executeQuery(
      ` SELECT
      wo.id ,
      wo.code ,
      wo.name ,
      wo.title ,
      wo.image ,
   wo.restaurant ,
      wo.restaurant ,
      wo.segregated ,
      wo.address ,
      wo.city ,
      wo.lat ,
      wo.lng ,
      wo.user_id,
      wo.status ,
  wo.description ,
  wo.opening_hours ,
      wo.is_covid_free ,
      wo.is_safe_space ,
      wo.is_clean_and_hygiene ,
      wo.is_sanitary_pads_available ,
      wo.is_makeup_room_available ,
      wo.is_coffee_available ,
      wo.is_sanitizer_available ,
      wo.is_feeding_room ,
      wo.is_wheelchair_accessible ,
      wo.is_washroom ,
      wo.is_premium ,
      wo.is_franchise ,
      wo.is_new ,
      wo.rating,
     wo.opening_hours,
      uo.created_at ,
      uo.updated_at ,
      uo.deleted_at,
      uo.expiry_date,

   o.title ,
      o.description ,
      o.image ,
    o.status 
      FROM
      offers o
    LEFT JOIN user_offers uo ON
      o.id = uo.offer_id
    LEFT JOIN woloos wo ON
      wo.id = o.woloo_id
    WHERE
      o.end_date <= CURDATE()
      AND uo.user_id = ${userId}`,
      []
    );
  }

  async redeemOffer(userId: number, offerId: number) {
    let data = {
      user_id: userId,
      offer_id: offerId,
    };
    return await this._executeQuery(`insert into user_offers set ?`, [data]);
  }

  async isOfferExist(offerId: number) {
    return await this._executeQuery(
      `SELECT * FROM offers where id=${offerId}`,
      []
    );
  }

  async getGiftPlan(giftSubId: number) {
    return await this._executeQuery(
      `SELECT *
    FROM subscriptions
    WHERE status = 1
        AND is_expired = 0
        AND is_voucher = 0
        AND id = ?
        AND plan_id IS NOT NULL`,
      [giftSubId]
    );
  }

  async sendGiftSubscription(userId: number, offerId: number) {
    let data = {
      user_id: userId,
      offer_id: offerId,
    };
    return await this._executeQuery(`insert into user_offers set ?`, [data]);
  }

  async exportXl() {
    return await this._executeQuery(
      `SELECT COUNT(id) as count FROM users u `,
      []
    );
  }

  async getUserBySponsorId(sponsorId: any) {
    return await this._executeQuery(
      `SELECT u.id,u.created_at as date_of_registration,u.name as customer_name, u.address, u.city, u.pincode, u.mobile, u.email, u.ref_code as unique_customer_code,  CASE
      WHEN u.subscription_id IS NULL AND u.voucher_id IS NULL AND u.expiry_date IS NOT NULL  THEN  "${Constants.voucher.FREE}"

      WHEN u.subscription_id IS NOT NULL AND u.expiry_date IS NOT NULL THEN "${Constants.voucher.SUBSCRIPTION}"

      WHEN u.voucher_id IS NOT NULL AND u.expiry_date IS NOT NULL THEN  "${Constants.voucher.VOUCHER}"
      ELSE ''
  END AS Subscription_type, CASE
  WHEN  u.expiry_date >= CURRENT_DATE() THEN 'Active'
ELSE 'Inactive'
END AS Subscription_status
FROM
  users u where id= ${sponsorId}`,
      []
    );
  }
  async getUserVoucherUsage(
    pageSize: any,
    pageIndex: any,
    sortOrder = "",
    query = "",
    isPaginated = false,
  ) {
    const paginationClause = isPaginated ? "LIMIT ? OFFSET ?" : "";
    const queryParameters = isPaginated ? [pageSize, pageIndex] : [];

    const sqlQuery = `
      SELECT 
        us.mobile,
        MAX(uvc.created_at) AS redemption_date,
        us.expiry_date,
        COUNT(uvc.user_id) AS count,
        MONTHNAME(MAX(uvc.created_at)) AS month,
        c.name AS corporate_name,
        sub.name AS sub_name
      FROM user_voucher_code AS uvc
      LEFT JOIN users AS us ON uvc.user_id = us.id
      LEFT JOIN voucher_codes AS vc ON uvc.voucher_code_id = vc.id
      LEFT JOIN corporates AS c ON vc.corporate_id = c.id
      LEFT JOIN subscriptions AS sub ON vc.subscriptions_id = sub.id
      ${query}
      GROUP BY us.id
      ${sortOrder}
      ${paginationClause}
    `;

    return this._executeQuery(sqlQuery, queryParameters);
  }

  async getUserVoucherUsageTotal(query: string) {
    return await this._executeQuery(
      `SELECT us.mobile,max(uvc.created_at) as redemption_date,us.expiry_date,count(uvc.user_id) as count,MONTHNAME(max(uvc.created_at)) as month,c.name as corporate_name,sub.name as sub_name FROM user_voucher_code as uvc  left join users as us on uvc.user_id=us.id left join voucher_codes as vc on uvc.voucher_code_id=vc.id left join corporates as c on vc.corporate_id=c.id left join subscriptions as sub on vc.subscriptions_id=sub.id ${query} group by us.id `,
      []
    );
  }
  async getReviewOptions() {
    return await this._executeQuery(
      `SELECT * FROM review_options as r where r.type="text" and r.group="review"`,
      []
    );
  }
  async getReviewList(pageSize: any, pageIndex: any, woloo_id: number) {
    return await this._executeQuery(
      `select uwr.*,JSON_OBJECT("id",us.id,"name",us.name,"avatar",us.avatar,"woloo_since",us.created_at) as user_details from user_woloo_ratings as uwr left join users as us on uwr.user_id=us.id where  uwr.review_description is not null and uwr.status =1 and uwr.woloo_id=${woloo_id} LIMIT ${pageSize} OFFSET ${pageIndex}`,
      []
    );
  }
  async getReviewListCount(woloo_id: number) {
    return await this._executeQuery(
      `select count(*) as count from  user_woloo_ratings as uwr where uwr.woloo_id=${woloo_id} and uwr.review_description is not null and uwr.status = 1 `,
      []
    );
  }
  async getPendingReviewStatus(user_id: number) {
    return await this._executeQuery(
      `SELECT woloo_id FROM woloo_wallets where   is_review_pending=1 and woloo_id is not null and user_id=${user_id} order by id desc limit 1  `,
      []
    );
  }
  async wahcertificate(woloo_id: number) {
    return await this._executeQuery(
      `SELECT * FROM woloos where id=${woloo_id}`,
      []
    );
  }
  async findUser(query: string) {
    return await this._executeQuery(`SELECT * FROM users ${query} `, []);
  }
  async getNewUser() {
    return await this._executeQuery(
      `select id from users order by id desc limit 1`,
      []
    );
  }
  async getWoloo(query: string) {
    return await this._executeQuery(
      `SELECT w.*,o.id as is_offer,o.end_date FROM woloos w left join offers o on w.id=o.woloo_id  ${query} limit 1 `,
      []
    );
  }
  async getSettingValue(query: string) {
    return await this._executeQuery(
      `SELECT s.value FROM settings as s ${query}`,
      []
    );
  }
  async getWolooScanHistory(userId: any) {
    return await this._executeQuery(
      `SELECT * FROM woloo_history_scans where user_id=${userId} order by id desc limit 1`,
      []
    );
  }
  async createWolooScanHistory(data: any) {
    return await this._executeQuery(`INSERT INTO woloo_history_scans SET ?`, [
      data,
    ]);
  }
  async createUserOffer(data: any) {
    return await this._executeQuery(`INSERT INTO user_offers SET ?`, [data]);
  }
  async createWolooWallet(data: any) {
    return await this._executeQuery(`INSERT INTO woloo_wallets SET ?`, [data]);
  }
  async getUserOffer(
    pageSize: any,
    pageIndex: any,
    sortOrder: string,
    query: string
  ) {
    return await this._executeQuery(
      `SELECT uo.id,us.mobile,of.title,uo.expiry_date,uo.status FROM user_offers as uo left join users as us on uo.user_id=us.id left join offers as of on uo.offer_id=of.id ${query}
    ${sortOrder}   LIMIT ? OFFSET ?`,
      [pageSize, pageIndex]
    );
  }

  async getUserOfferCount(query: string) {
    return await this._executeQuery(
      `SELECT count(uo.id) as count FROM user_offers as uo left join users as us on uo.user_id=us.id left join offers as of on uo.offer_id=of.id ${query}`,
      []
    );
  }

  async addUserOffer(data: any) {
    return await this._executeQuery("insert into user_offers set ?", [data]);
  }

  async deleteUserOfferById(id: any) {
    return await this._executeQuery(
      "update user_offers set status= 0 WHERE id = ?",
      [id]
    );
  }

  async fetchUserOfferById(id: number) {
    return await this._executeQuery(
      `SELECT uo.id,us.id as us_id,of.id as offer_id,us.mobile,of.title,uo.expiry_date,uo.status FROM user_offers as uo left join users as us on uo.user_id=us.id left join offers as of on uo.offer_id=of.id where uo.id = ?`,
      [id]
    );
  }

  async updateUserOffer(data: any, id: number) {
    return await this._executeQuery(`update user_offers set ? where id = ? `, [
      data,
      id,
    ]);
  }
  async getOffer() {
    return await this._executeQuery(`select id,title from offers  `, []);
  }
  async getRoles() {
    return await this._executeQuery(
      `select id,display_name from roles order by id desc`,
      []
    );
  }
  async getUserDetailByUser_id(user_id: any) {
    return await this._executeQuery(
      `SELECT woloo_id,role_id FROM users where id=${user_id}`,
      []
    );
  }
  async userLog(data: any) {
    data.event_data = JSON.stringify(data.event_data);
    return await this._executeQuery(
      `INSERT INTO user_logs(event_data, event_name, user_id)
      VALUES (
        '${data.event_data}',
        '${data.event_name}',
        '${data.user_id}'
      );
      `,
      []
    );
  }
  async getUserDetailBySponser_id(user_id: any) {
    return await this._executeQuery(
      `SELECT * FROM users where sponsor_id=${user_id}`,
      []
    );
  }

  async resetPassword(
    email: string,
    password: string,
    isDummyPassword: number
  ) {
    return await this._executeQuery(
      `update users set password=?, isDummyPassword=?  where email=?`,
      [password, isDummyPassword, email]
    );
  }

  async updatePassword(
    email: string,
    password: string,
    isDummyPassword: number
  ) {
    return await this._executeQuery(
      `UPDATE users SET password=?, isDummyPassword=? WHERE email=?`,
      [password, isDummyPassword, email]
    );
  }
}
