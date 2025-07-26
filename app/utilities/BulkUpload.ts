import { Template } from "../Models/BulkUpload.model";
import * as xlsx from "xlsx";
import path = require("path");
import common from "../utilities/common";
import { WolooGuestModel } from "../Models/WolooGuest.model";
import { WolooHostModel } from "../Models/WolooHost.model";
import Hashing from "./Hashing";
import Guest from "../Services/CommonService/Guest";
import { SettingModel } from "../Models/Setting.model";
import { WalletModel } from "../Models/Wallet.model";
import config = require("../config");
import transporter from "./Email";
import SMS from "../utilities/SMS";
import DownloadIMG from "../utilities/DownloadImgandStoreLocally";
import moment = require("moment");
import { uploadLocalFile } from "./S3Bucket";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const fs = require("fs");
export default {
  listTemplate: async () => {
    try {
      const result = await new Template().getTemplate();
      if (result.length < 1) throw new Error("No templated found");
      return result;
    } catch (error) {
      return error;
    }
  },

  importTemplate: async (filePath: string, table: any) => {
    try {
      const file = xlsx.readFile(filePath);
      const sheetName = file.SheetNames[0];
      const sheet = file.Sheets[sheetName];
      let data = [];
      for (let r in sheet) {
        if (sheet[r].v) data.push(sheet[r].v);
      }
      await new Template().createTemplate("SomeFile", data.toString(), table);
      return "Template Created Successfully";
    } catch (error) {
      console.log("Error Import", error);
      return "Failed to import template";
    }
  },
  getTemplate: async (templateid: any) => {
    try {
      const result = await new Template().getSingleTemplate(templateid);
      if (result.length < 1) throw new Error("No template found");
      return result[0];
    } catch (error) {
      return error;
    }
  },

  getCols: async (templateid: any) => {
    try {
      const result = await new Template().getTemplateCols(templateid);
      const tableCols = await new Template().getTableCols(result[0].tableName);
      const tab = tableCols.map(
        (ele: { [x: string]: any }) => ele["COLUMN_NAME"]
      );
      const temp = result[0].template_cols.split(",");
      const colstemplated = common.mapKeys(temp);
      const colstable = common.mapKeys(tab);
      return { templateCols: colstemplated, tableCols: colstable };
    } catch (error) {
      return { error: "Failed to Get Cols" };
    }
  },

  mapTemplate: async (templateid: any, mappedCols: { [x: string]: any }) => {
    try {
      let template = await new Template().getTemplateCols(templateid);
      template = template[0].template_cols.split(",");
      const predefined: any = {};
      let finalCols = {};
      const rules: any = {};
      for (let i = 0; i < template.length; i++) {
        let templateKey = template[i];
        if (templateKey) {
          if (mappedCols[templateKey]) {
            const checkColumn =
              mappedCols[templateKey].hasOwnProperty("column");
            const checkDefault =
              mappedCols[templateKey].hasOwnProperty("default");
            const checkRequired =
              mappedCols[templateKey].hasOwnProperty("isRequired");

            if (checkRequired) {
              if (mappedCols[templateKey]["isRequired"] == false) {
                delete mappedCols[templateKey];
              }
            }
            if (checkColumn) {
              predefined[templateKey] = mappedCols[templateKey]["column"];
            }

            if (checkDefault) {
              rules[templateKey] = mappedCols[templateKey];
            }
          } else {
            predefined[templateKey] = templateKey;
          }
        }
      }
      finalCols = { ...predefined };
      const result = await new Template().mapTemplate(
        {
          mapped_cols: JSON.stringify(finalCols),
          rules: JSON.stringify(rules),
        },
        templateid
      );
      if (result.affectedRows == 1) {
        return "Rows Mapped Successfully";
      } else {
        throw new Error("Failed to Map Template");
      }
    } catch (error) {
      return error;
    }
  },

  bulkUpload: async (templateId: any, fileS3URL: any) => {
    const fetchExcelData = async (url: any) => {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const workbook = xlsx.read(response.data, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return xlsx.utils.sheet_to_json(sheet, { defval: "" });
    };

    const validateSheetData = (data: any) => {
      if (data.length === 0) throw new Error("Sheet has 0 entries. Please input data and try again.");
      if (data.length > 100) throw new Error("Sheet should not have more than 100 rows.");
    };

    const findEmptyKeys = (data: any, ignoreKeys: any) => {
      return data.flatMap((row: any) =>
        Object.keys(row).filter(
          (key) => !ignoreKeys.includes(key) && (row[key] === null || row[key] === "")
        )
      );
    };

    const findDuplicates = (data: any, properties: any) => {
      const seen = new Map();
      return data.filter((row: any) =>
        properties.some((prop: any) => {
          const value = row[prop];
          if (!value) return false;
          if (seen.has(prop + value)) return true;
          seen.set(prop + value, true);
          return false;
        })
      );
    };

    const sheetData = await fetchExcelData(fileS3URL);
    validateSheetData(sheetData);

    const template = await new Template().getTemplateCols(templateId);
    const { mapped_cols: rawMappedCols = {}, tableName } = template[0];
    const mapped_cols = typeof rawMappedCols === "string" ? JSON.parse(rawMappedCols) : {};

    let newsheetData = (sheetData as any).filter((row: any) => row.is_new === 1).map(({ id, ...rest }: any) => rest);
    let updatesheetData = (sheetData as any).filter((row: any) => row.is_new === 0);

    const ignoredKeys = [
      "id",
      "email",
      "recommended_by",
      "recommended_mobile",
      "rating",
      "description",
      "opening_hours",
    ];

    const emptyKeys = findEmptyKeys(newsheetData, ignoredKeys);
    if (emptyKeys.length) {
      throw new Error(`${Array.from(new Set(emptyKeys)).join(", ")} should not be empty.`);
    }

    const duplicates = findDuplicates(sheetData, ["mobile", "email"]);
    if (duplicates.length) throw new Error(`Sheet contains duplicate entries.`);

    if (!updatesheetData.every((row: any) => row.id)) {
      throw new Error("Some update rows are missing IDs.");
    }

    const nonExistentIds = await Promise.all(
      updatesheetData.map(async (row: any) => {
        const exists = await new WolooGuestModel().isHostExist(row.id);
        return exists.length === 0 ? row.id : null;
      })
    );

    const missingIds = nonExistentIds.filter(Boolean);
    if (missingIds.length) {
      throw new Error(`The following IDs are not present: ${missingIds.join(", ")}`);
    }

    const repeatedEmails = await Promise.all(
      newsheetData.map(async (row: any) => {
        if (!row.email) return null;
        const user = await new WolooGuestModel().getUserByEmail(row.email);
        return user.length ? { email: row.email, username: user[0].name } : null;
      })
    );

    const repeatedMobiles = await Promise.all(
      newsheetData.map(async (row: any) => {
        if (!row.mobile) return null;
        const user = await new WolooGuestModel().getUserByMobile(row.mobile);
        return user.length ? { mobile: row.mobile, username: user[0].name } : null;
      })
    );

    const emailConflicts = repeatedEmails.filter(Boolean);
    const mobileConflicts = repeatedMobiles.filter(Boolean);

    if (emailConflicts.length || mobileConflicts.length) {
      const emailMessage = emailConflicts.map((e: any) => `${e.email} (User: ${e.username})`).join(", ");
      const mobileMessage = mobileConflicts.map((m: any) => `${m.mobile} (User: ${m.username})`).join(", ");
      throw new Error(`Conflicts found. Emails: ${emailMessage}; Mobiles: ${mobileMessage}`);
    }

    async function getS3Url(url: string) {
      try {
        const tempImageName = `image-${Date.now().toString()}-${uuidv4()}.jpg`; // Unique for each image
        await DownloadIMG.downloadAndStoreImage(
          url,
          `public/image/${tempImageName}`
        );

        const uploadPath = `Images/WolooHost/${tempImageName.replace(
          ".jpg",
          ".png"
        )}`; // Unique S3 path
        const uploadStatus = await uploadLocalFile(
          `public/image/${tempImageName}`,
          uploadPath,
          "image/png"
        );

        // Delete the temporary image file after upload
        fs.unlinkSync(`public/image/${tempImageName}`);

        return uploadStatus;
      } catch (error) {
        console.error("Error in getS3Url function:", error);
        return null;
      }
    }

    async function processImages(imageString: any) {
      const imagePaths = [];
      const imageUrls = imageString.split(',');

      for (const img of imageUrls) {
        const s3ImageLink = await getS3Url(img);
        if (s3ImageLink) {
          const url = new URL(s3ImageLink);
          imagePaths.push(url.pathname);
        }
      }

      return imagePaths;
    }

    const newSheet___Data = [];
    for (const data of newsheetData) {
      if (data?.image) {
        data.image = `['${await processImages(data?.image)}']`;
      }
      newSheet___Data.push(data);
    }
    newsheetData = [...newSheet___Data];

    const updateSheet___Data = [];
    for (const data of updatesheetData) {
      if (data?.image) {
        data.image = `['${await processImages(data?.image)}']`;
      }
      updateSheet___Data.push(data);
    }
    updatesheetData = [...updateSheet___Data];

    // Woloo host code creation
    for (let data of newsheetData) {
      data.code =
        "WH" +
        data.city.toString().substr(0, 3).toUpperCase() +
        Math.floor(Math.random() * 90000);
      // data.status = 1
    }

    //opening hour calculation and error handling
    let time_Format = /(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)/;

    const validateOpeningClosingHours = (obj: any, hourKey: string, closingKey: string, idKey: string) => {
      if (obj[hourKey] && !time_Format.test(obj[hourKey])) {
        throw new Error(`Invalid ${hourKey}. The time format is HH:MM:SS`);
      }
      if (obj[closingKey] && !time_Format.test(obj[closingKey])) {
        throw new Error(`Invalid ${closingKey}. The time format is HH:MM:SS`);
      }
      if (!obj[closingKey]) {
        throw new Error(`${closingKey} is required`);
      }
      return {
        woloo: obj[idKey],
        open_time: obj[hourKey],
        close_time: obj[closingKey],
      };
    };

    // for new sheet data
    const mappedData: any = [];
    const rules = template[0].rules ? JSON.parse(template[0].rules) : {};

    const openingHours: any = [];
    const codes = [];
    if (newsheetData?.length) {
      for (let index in newsheetData) {
        let obj: any = newsheetData[index];
        let keys = Object.keys(obj);
        let temp: any = {};
        codes.push(obj["code"]);

        // Process opening hours fields dynamically
        for (let i = 1; i <= 3; i++) {
          const openingKey = `opening_hours_${i}`;
          const closingKey = `closing_hours_${i}`;
          if (obj[openingKey] && obj[closingKey]) {
            openingHours.push(validateOpeningClosingHours(obj, openingKey, closingKey, "code"));
          }
        }

        for (let k in keys) {
          let key = keys[k];
          if (mapped_cols[key]) {
            if (obj[key]) {
              temp[key] = obj[key];
            } else if (rules.hasOwnProperty(key)) {
              const checkDefault = rules[key].hasOwnProperty("default");
              if (checkDefault) {
                temp[key] = rules[key]["default"];
              }
            } else {
              temp[key] = "";
            }
          }
        }
        mappedData.push(temp);
      }
    }

    // for update sheet data
    const mappedUpdateData: any = [];
    const openingHours_update: any = [];
    const codes_update = [];

    if (updatesheetData?.length) {
      for (let index in updatesheetData) {
        let obj: any = updatesheetData[index];
        let keys = Object.keys(obj);
        let temp: any = {};
        codes_update.push(obj["code"]);

        // Process opening hours fields dynamically
        for (let i = 1; i <= 3; i++) {
          const openingKey = `opening_hours_${i}`;
          const closingKey = `closing_hours_${i}`;
          if (obj[openingKey] && obj[closingKey]) {
            openingHours_update.push(validateOpeningClosingHours(obj, openingKey, closingKey, index));
          }
        }

        for (let k in keys) {
          let key = keys[k];

          if (mapped_cols[key]) {
            if (obj[key]) {
              temp[key] = obj[key];
            }
          }
        }
        mappedUpdateData.push(temp);
      }
    }

    // Function to create new user for host
    async function createHostUser(data: any, wolooId: any) {
      let password = new Hashing().generatePassword();
      let userId = await Guest.createUser(
        data?.email,
        data?.mobile,
        data?.name,
        password,
        null,
        wolooId
      );

      if (userId) {
        const registrationPoint =
          await new SettingModel().getRegistartionPoint();
        const walletData = {
          user_id: userId,
          transaction_type: "CR",
          remarks: "Registration Point",
          value: registrationPoint[0]?.value,
          type: "Registration Point",
          is_gift: 0,
        };
        await new WalletModel().createWallet(walletData);
        let updateData = { user_id: userId };
        await new WolooHostModel().updateWolooHost(updateData, wolooId);
        sendWelcomeEmail(data.email, password); // Function to send a welcome email
        sendSMSNotification(data.mobile); // Function to send an SMS notification
      }
    }

    // Helper functions for sending email and SMS
    async function sendWelcomeEmail(email: string, password: string) {
      const __dirname = path.resolve();
      const filePath = path.join(
        __dirname,
        "/app/views/emailTemplate/index.html"
      );
      fs.readFile(filePath, "utf8", function (error: any, html: any) {
        if (error) throw error;
        html = html
          .replace("{{password}}", password)
          .replace("{{email}}", email);
        const mailData = {
          from: config.email.email,
          to: email,
          subject: "Woloo Host Credentials",
          text: "",
          attachments: [],
          html: html,
        };
        transporter.sendMail(
          mailData,
          function (err: any, info: { messageId: any }) {
            if (err) console.error("Failed to send Mail");
            else
              console.log({
                message: "Mail sent successfully",
                message_id: info.messageId,
              });
          }
        );
      });
    }

    async function sendSMSNotification(mobile: number) {
      let link = "http://bit.ly/487YPVM";
      let admin = "https://portal.woloo.in/sign-in";
      let message = `The Woloo host user has been created with the mobile number ${mobile},kindly download the App from ${link} and check if it is appearing in the map and also validate the other information.Also check your dashboard on Woloo Admin ${admin} -LOOM & WEAVER RETAIL PVT LTD`;
      let query = `where s.key ="site.host_creation_template_id"`;
      let tempId = await new WolooGuestModel().getSettingValue(query);
      const sendSms = await SMS.sendRaw(mobile, message, tempId[0].value);
      if (sendSms.smslist.sms.status === "success") {
        console.log("SMS sent successfully");
      } else {
        console.log("SMS failed");
      }
    }

    // Bulk Insert
    const data = mappedData.map((obj: any) => Object.values(obj));
    const keysMap = mappedData?.length && Object.keys(mappedData[0]);
    let countRecord = 0;
    let InsertedwolooIds: number[] = [];

    if (data.length) {
      // Split into batches and insert in parallel
      const batchedData = [];
      while (data.length) batchedData.push(data.splice(0, 100)); // Adjust batch size if needed

      const insertResults = await Promise.all(
        batchedData.map(batch =>
          new Template().bulkInsert(tableName, batch, keysMap)
        )
      );

      countRecord = insertResults.reduce((sum, res) => sum + res?.affectedRows, 0);
      InsertedwolooIds = insertResults.map(res => res?.insertId).flat();
    }

    // Bulk Update
    const data_Update = mappedUpdateData.map((obj: any) => Object.values(obj));
    const keys_update_Map = mappedUpdateData?.length && Object.keys(mappedUpdateData[0]);
    let updatecountRecord = 0;
    const ids_: any = mappedUpdateData?.map((obj: any) => obj.id);

    if (data_Update.length) {
      const batchedUpdateData = [];
      while (data_Update.length) batchedUpdateData.push(data_Update.splice(0, 100));      
      const updateResults = await Promise.all(
        batchedUpdateData.map(batch =>
          new Template().bulkUpdate(tableName, batch, keys_update_Map, ids_)
        )
      );

      updatecountRecord = updateResults.reduce((sum, res) => sum + res, 0);
    }

    // Parallel Host User Creation for Inserted and Updated Hosts
    await Promise.all([
      ...mappedData.map((data: any, i: number) => createHostUser(data, InsertedwolooIds[0] + i)),
      ...mappedUpdateData.map(async (data: any) => {
        const wolooId = data.id;
        const isHostUserExist = await new WolooGuestModel().getHostUserByHostId(wolooId);
        if (!isHostUserExist.length) {
          await createHostUser(data, wolooId);
        }
      }),
    ]);

    // Insert Opening Hours
    const ids = codes?.length && (await new WolooHostModel().selectIdFromWoloos(codes));
    if (ids?.length) {
      const openhourData = ids.flatMap((id: any) => {
        const relevant = openingHours.filter((o: any) => o.woloo === id.code);
        return relevant.map((o: any) => {
          o.id = id.id;
          return Object.values(o).slice(1); // Exclude unnecessary fields
        });
      });

      if (openhourData.length) {
        await new Template().bulkInsert("woloo_business_hours", openhourData, ["open_time", "close_time", "woloo_id"]);
      }
    }

    // Update Opening Hours
    if (ids_?.length) {
      await Promise.all(
        ids_.map((id: any) =>
          new WolooHostModel().updateBusinessHour({ status: 0 }, id)
        )
      );

      const update_openhourData = ids_.flatMap((id: any) => {
        const relevant = openingHours_update.filter((o: any) => o.woloo === id);
        return relevant.map((o: any) => {
          o.id = id;
          return Object.values(o).slice(1);
        });
      });

      if (update_openhourData.length) {
        await new Template().bulkInsert("woloo_business_hours", update_openhourData, ["open_time", "close_time", "woloo_id"]);
      }
    }

    // Final Summary
    const failedRecord = mappedData.length - countRecord;

    return {
      inserted: countRecord,
      failedRecord,
      updated: updatecountRecord,
    };
  }
}
