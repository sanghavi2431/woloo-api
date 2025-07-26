import moment from "moment";

import { WolooHostModel } from "../Models/WolooHost.model";
import nodemailer from "nodemailer";
import formidable from "formidable";
import {
  getListOfObjectsInS3Bucket,
  getPresignedDownloadUrl,
  uploadFile,
} from "../utilities/S3Bucket";
import Map from "../utilities/Map";
import MapMode from "../Constants/MapMode";
import smsTemplate from "../Constants/common";
import constant from "../Constants/common";
import config from "../config";
import _ from "lodash";
import dayjs from "dayjs";
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(timezone);
import BaseModel from "../Models/BaseModel";
import { WolooGuestModel } from "./../Models/WolooGuest.model";
import razorpay from "../utilities/Razorpay";
import { Transactions } from "../Models/Transactions";
import { SubscriptionModel } from "../Models/Subscription.model";
import common from "../utilities/common";
import { WalletModel } from "../Models/Wallet.model";
import SMS from "../utilities/SMS";
import LOGGER from "../config/LOGGER";
import HttpClient from "../utilities/HttpClient";
import Guest from "./CommonService/Guest";
import * as fs from "fs";
import * as path from "path";
const rboxer = require("rboxer");
import * as polyline from "google-polyline";
import { map } from "lodash";
import { parse } from "path";
import transporter from "../utilities/Email";
import Hashing from "../utilities/Hashing";
import { SettingModel } from "../Models/Setting.model";

const createWolooHost = async (req: any) => {
  try {
    let wolooData, s3Path, response: any, fields: any, files: any;
    // @ts-ignore
    response = await processWolooHostForm(req);
    if (response instanceof Error) throw response;
    fields = response.fields;

    let {
      id,
      code,
      name,
      mobile,
      title,
      image,
      opening_hours,
      restaurant,
      segregated,
      address,
      city,
      lat,
      lng,
      user_id,
      status,
      description,
      created_at,
      updated_at,
      deleted_at,
      is_covid_free,
      is_safe_space,
      is_clean_and_hygiene,
      is_sanitary_pads_available,
      is_makeup_room_available,
      is_coffee_available,
      is_sanitizer_available,
      is_feeding_room,
      is_wheelchair_accessible,
      is_washroom,
      is_premium,
      is_franchise,
      pincode,
      recommended_by,
      recommended_mobile,
      is_new,
      rating,
      email,
    } = response.fields;

    s3Path = response.s3Path;

    if (email?.length) {
      let checkEmail = await new WolooGuestModel().getUserByEmail(email);
      if (checkEmail.length != 0)
        throw new Error("Email id is already associated with another user!");
    }
    let checkMobile = await new WolooGuestModel().getUserByMobile(mobile);
    if (checkMobile.length != 0)
      throw new Error("Mobile number is already associated with another user!");

    let Woloos: any = {};

    if (!name) throw new Error("Please enter your name");
    Woloos.name = name;

    if (!lat) throw new Error("lat field required");
    Woloos.lat = lat;

    if (!lng) throw new Error("lng field required");
    Woloos.lng = lng;

    if (!address) throw new Error("Please enter your address");
    Woloos.address = address;

    if (!city) throw new Error("Please enter your city");
    Woloos.city = city;

    Woloos.code =
      "WH" +
      fields.city.toString().substr(0, 3).toUpperCase() +
      Math.floor(Math.random() * 90000);

    if (!title) throw new Error("title field required");
    Woloos.title = title;

    if (!restaurant) throw new Error("restaurant field required");
    Woloos.restaurant = restaurant;

    if (!segregated) throw new Error("segregated field required");
    Woloos.segregated = segregated;

    // if (!email) throw new Error("email field required");
    Woloos.email = email;

    if (!mobile) throw new Error("mobile field required");
    Woloos.mobile = mobile;

    if (description) Woloos.description = description;
    if (rating) Woloos.rating = rating;

    if (!is_franchise) throw new Error("is_franchise field required");
    Woloos.is_franchise = is_franchise;

    Woloos.status = 1;

    if (!pincode) throw new Error("pincode field required");
    Woloos.pincode = pincode;

    if (recommended_by) Woloos.recommended_by = recommended_by;

    if (recommended_mobile) Woloos.recommended_mobile = recommended_mobile;

    if (!is_covid_free) throw new Error("is_covid_free field required");
    Woloos.is_covid_free = is_covid_free;

    if (is_safe_space) Woloos.is_safe_space = is_safe_space;

    if (is_clean_and_hygiene)
      Woloos.is_clean_and_hygiene = is_clean_and_hygiene;

    if (is_sanitary_pads_available)
      Woloos.is_sanitary_pads_available = is_sanitary_pads_available;

    if (is_makeup_room_available)
      Woloos.is_makeup_room_available = is_makeup_room_available;

    if (is_coffee_available) Woloos.is_coffee_available = is_coffee_available;

    if (is_sanitizer_available)
      Woloos.is_sanitizer_available = is_sanitizer_available;

    if (is_feeding_room) Woloos.is_feeding_room = is_feeding_room;

    if (is_wheelchair_accessible)
      Woloos.is_wheelchair_accessible = is_wheelchair_accessible;

    if (!is_washroom) throw new Error("is_washroom  field required");
    Woloos.is_washroom = is_washroom;

    if (is_premium) Woloos.is_premium = is_premium;

    Woloos.is_new = 1;

    Woloos.image = "['" + s3Path.toString() + "']";

    wolooData = await new WolooHostModel().createWolooHost(Woloos);

    if (!wolooData.affectedRows) throw new Error("Registration  failed");
    let { insertId } = wolooData;

    if (insertId) {
      let password = new Hashing().generatePassword();

      let userId = await Guest.createUser(
        email,
        mobile,
        name,
        password,
        null,
        insertId
      );

      if (userId) {
        var getRegistartionPoint =
          await new SettingModel().getRegistartionPoint();

        const walletdata = {
          user_id: userId,
          transaction_type: "CR",
          remarks: "Registration Point",
          value: getRegistartionPoint[0]?.value,
          type: "Registration Point",
          is_gift: 0,
        };
        await new WalletModel().createWallet(walletdata);

        let updateWolooData = {
          user_id: userId,
        };

        await new WolooHostModel().updateWolooHost(updateWolooData, insertId);

        const __dirname = path.resolve();
        const filePath = path.join(
          __dirname,
          "/app/views/emailTemplate/index.html"
        );
        fs.readFile(filePath, "utf8", function (error: any, html: any) {
          if (error) {
            throw error;
          }
          if (email?.length) {
            html = html.replace("{{password}}", password);
            html = html.replace("{{email}}", email);
            const mailData = {
              from: config.email.email,
              to: email,
              subject: `Woloo Host Credentials`,
              text: ``,
              attachments: [],
              html: html,
            };
            transporter.sendMail(mailData, function (err: any, info: any) {
              if (err) console.error({ message: "Failed to send Mail" });
              else
                console.log({
                  message: "Mail send ",
                  message_id: info.messageId,
                });
            });
          }
        });
        let link = "http://bit.ly/487YPVM";
        let admin = "https://portal.woloo.in/sign-in";

        let message = `The Woloo host user has been created with the mobile number ${mobile},kindly download the App from ${link} and check if it is appearing in the map and also validate the other information.Also check your dashboard on Woloo Admin ${admin} -LOOM & WEAVER RETAIL PVT LTD`;

        let query = `where s.key ="site.host_creation_template_id"`;
        let tempId = await new WolooGuestModel().getSettingValue(query);
        const sendSms = await SMS.sendRaw(mobile, message, tempId[0].value);
      }
    }
    if (opening_hours) {
      let arry = JSON.parse(opening_hours);
      for (let i in arry) {
        let obj = {
          open_time: arry[i].start_time,
          close_time: arry[i].end_time,
          woloo_id: insertId,
          status: 1,
        };
        wolooData = await new WolooHostModel().insertBusinessHours(obj);
      }
    }

    return { MESSAGE: "WOLOO CREATED SUCCESSFULLY" };
  } catch (e) {
    throw e;
  }
};

const addWolooHost = async (req: any) => {
  try {
    let wolooUserData, s3Path, response: any, fields: any, files: any;
    // @ts-ignore
    let userId = req.session.id;
    response = await processWolooHostForm(req);
    if (response instanceof Error) throw response;
    fields = response.fields;
    s3Path = response.s3Path;

    let Woloos: any = {};

    if (!fields.name) throw new Error("Please enter your name");
    Woloos.name = fields.name;

    if (!fields.city) throw new Error("Please enter your city");
    Woloos.city = fields.city;

    if (!fields.pincode) throw new Error("Please enter your pincode");
    Woloos.pincode = fields.pincode;

    Woloos.code =
      "WH" +
      fields.city.toString().substr(0, 3).toUpperCase() +
      Math.floor(Math.random() * 90000);

    Woloos.title = fields.name;

    if (!fields.address) throw new Error("Please enter your address");
    if (fields.address) Woloos.address = fields.address;

    if (!fields.lat) throw new Error("Please enter your latitude");
    if (fields.lat) Woloos.lat = fields.lat;

    if (!fields.lng) throw new Error("Please enter your longitude");
    if (fields.lng) Woloos.lng = fields.lng;

    if (s3Path[0]) Woloos.image = "['" + s3Path.toString() + "']";

    let getUserDetails = await new WolooGuestModel().getUserByID(userId);

    Woloos.user_id = userId;
    Woloos.email = getUserDetails?.email;
    Woloos.mobile = getUserDetails?.mobile;
    Woloos.is_new = 1;
    let checkEmail = await new WolooHostModel().getWolooByEmail(
      getUserDetails?.email
    );
    if (checkEmail.length != 0)
      return { message: "Email id is already associated with another woloo!" };
    // throw new Error("Email id is already associated with another user!");
    let checkMobile = await new WolooHostModel().getWolooByMobile(
      getUserDetails?.mobile
    );
    if (checkMobile.length != 0)
      return {
        message: "Mobile number is already associated with another woloo!",
      };
    // throw new Error("Mobile number is already associated with another user!");

    wolooUserData = await new WolooHostModel().createWolooHost(Woloos);
    if (!wolooUserData.affectedRows) throw new Error("Registration  failed");

    // try {
    // let message: any
    // message = await new WolooGuestModel().getAddWolooMsg();
    /////

    let password = new Hashing().generatePassword();

    let user = await Guest.updateUser(
      userId,
      getUserDetails?.email,
      getUserDetails?.mobile,
      fields.name,
      password,
      null,
      wolooUserData.insertId
    );
    if (user.affectedRows == 1) {
      if (getUserDetails?.email && getUserDetails?.email !== "") {
        // const data1 = {
        //   to: getUserDetails.email,
        //   from: "info@woloo.in",
        //   from_name: "Woloo",
        //   subject: "Woloo - Woloo Host",
        //   text: message[0].value,
        // };
        // const transporter = nodemailer.createTransport({
        //   port: 587,
        //   host: config.email.hostname,
        //   tls: { rejectUnauthorized: false },
        //   debug: true,
        //   auth: {
        //     type: "LOGIN",
        //     user: config.email.email_user,
        //     pass: config.email.email_pass,
        //   },
        // });

        // const emailStatus = await transporter.sendMail(data1);
        // if (emailStatus.accepted.length && emailStatus.accepted.length > 0) {
        //   return {
        //     message: "WOLOO CREATED SUCCESSFULLY"
        //   };
        // }
        // let password = new Hashing().generatePassword();
        const __dirname = path.resolve();
        const filePath = path.join(
          __dirname,
          "/app/views/emailTemplate/index.html"
        );
        fs.readFile(filePath, "utf8", function (error: any, html: any) {
          if (error) {
            throw error;
          }

          html = html.replace("{{password}}", password);
          html = html.replace("{{email}}", getUserDetails?.email);
          const mailData = {
            from: config.email.email,
            to: getUserDetails?.email,
            subject: `Woloo Host Credentials`,
            text: ``,
            attachments: [],
            html: html,
          };

          transporter.sendMail(mailData, function (err: any, info: any) {
            if (err) console.log({ message: "Failed to send Mail" });
            else
              console.log({
                message: "Mail send ",
                message_id: info.messageId,
              });
          });
        });
      }
      if (getUserDetails?.mobile && getUserDetails?.mobile !== "") {
        const mobileNumber = getUserDetails?.mobile;
        let link = "http://bit.ly/487YPVM";
        let admin = "https://portal.woloo.in/sign-in";

        let message = `The Woloo host user has been created with the mobile number ${mobileNumber},kindly download the App from ${link} and check if it is appearing in the map and also validate the other information.Also check your dashboard on Woloo Admin ${admin} -LOOM & WEAVER RETAIL PVT LTD`;

        let query = `where s.key ="site.host_creation_template_id"`;
        let tempId = await new WolooGuestModel().getSettingValue(query);
        const sendSms = await SMS.sendRaw(
          mobileNumber,
          message,
          tempId[0].value
        );
        await new WolooHostModel().insertBusinessHours({
          open_time: "09:00:00",
          close_time: "23:00:00",
          woloo_id: wolooUserData.insertId,
          status: 1,
        });

        if (sendSms.smslist.sms.status == "success") {
          return {
            message: "WOLOO CREATED SUCCESSFULLY",
          };
        } else {
          throw new Error("Something went wrong !");
        }
      }
    } else {
      throw new Error("Something went wrong !");
    }

    return { Response: "WOLOO CREATED SUCCESSFULLY" };
  } catch (e) {
    throw e;
  }
};

// const fetchWolooHost = async (
//   pageIndex: any,
//   pageSize: any,
//   sort: any,
//   query: string
// ) => {
//   let orderQuery: string;
//   if (sort.key != "") {
//     orderQuery = " ORDER BY " + sort.key + " " + sort.order + " ";
//   } else {
//     orderQuery = " ORDER BY w.id DESC";
//   }
//   let woloo;

//   woloo = await new WolooHostModel().getWolooHost(
//     pageSize,
//     (pageIndex - 1) * pageSize,
//     orderQuery,
//     query
//   );

//   // console.log("woloo", woloo)
//   if (woloo.length < 1) return Error(" Woloo Not Found ! ");

//   for (let obj of woloo) {
//     let { image, is_new } = obj;
//     if (image?.includes(",")) {
//       // console.log(image)
//       let imageArray = eval(image)?.[0]?.split(",");
//       obj.image = imageArray;
//     } else {
//       obj.image = [];
//     }
//     // obj.base_url =
//     //   obj.is_new === 1 ? config.s3imagebaseurl : config.wolooimagebaseurl + "/";
//     obj.base_url = config.s3imagebaseurl;

//     obj.is_safe_space = obj.is_safe_space
//       ? { label: "YES", value: 1 }
//       : {
//           label: "NO",
//           value: 0,
//         };
//     obj.is_covid_free = obj.is_covid_free
//       ? { label: "YES", value: 1 }
//       : {
//           label: "NO",
//           value: 0,
//         };
//     obj.is_clean_and_hygiene = obj.is_clean_and_hygiene
//       ? {
//           label: "YES",
//           value: 1,
//         }
//       : { label: "NO", value: 0 };
//     obj.is_sanitary_pads_available = obj.is_sanitary_pads_available
//       ? {
//           label: "YES",
//           value: 1,
//         }
//       : { label: "NO", value: 0 };
//     obj.is_makeup_room_available = obj.is_makeup_room_available
//       ? {
//           label: "YES",
//           value: 1,
//         }
//       : { label: "NO", value: 0 };
//     obj.is_coffee_available = obj.is_coffee_available
//       ? {
//           label: "YES",
//           value: 1,
//         }
//       : { label: "NO", value: 0 };
//     obj.is_sanitizer_available = obj.is_sanitizer_available
//       ? {
//           label: "YES",
//           value: 1,
//         }
//       : { label: "NO", value: 0 };
//     obj.is_feeding_room = obj.is_feeding_room
//       ? { label: "YES", value: 1 }
//       : {
//           label: "NO",
//           value: 0,
//         };
//     obj.is_washroom = obj.is_washroom
//       ? { label: "Western", value: 1 }
//       : {
//           label: "Indian",
//           value: 0,
//         };
//     obj.is_premium = obj.is_premium
//       ? { label: "YES", value: 1 }
//       : { label: "NO", value: 0 };
//     obj.is_franchise = obj.is_franchise
//       ? { label: "YES", value: 1 }
//       : {
//           label: "NO",
//           value: 0,
//         };
//     obj.is_wheelchair_accessible = obj.is_wheelchair_accessible
//       ? {
//           label: "YES",
//           value: 1,
//         }
//       : { label: "NO", value: 0 };
//     obj.status = obj.status
//       ? { label: "ACTIVE", value: obj.status }
//       : { label: "INACTIVE", value: obj.status };
//     obj.restaurant =
//       obj.restaurant == "1"
//         ? { label: "YES", value: 1 }
//         : {
//             label: "NO",
//             value: 0,
//           };

//     obj.segregated =
//       obj.segregated == "1"
//         ? { label: "YES", value: 1 }
//         : { label: "NO", value: 0 };

//     obj.host_owner = obj.description;
//   }
//   // console.log("..........................wo>", woloo)
//   return woloo;
// };

const fetchWolooHost = async (
  pageIndex: number,
  pageSize: number,
  sort: { key: string; order: string },
  query: string
) => {
  const createLabelValue = (condition: any, yesLabel = "YES", noLabel = "NO") => ({
    label: condition ? yesLabel : noLabel,
    value: condition ? 1 : 0,
  });

  const orderQuery =
    sort.key && sort.order
      ? ` ORDER BY ${sort.key} ${sort.order} `
      : " ORDER BY w.id DESC";

  const woloo = await new WolooHostModel().getWolooHost(
    pageSize,
    (pageIndex - 1) * pageSize,
    orderQuery,
    query
  );

  if (!woloo.length) throw new Error("Woloo Not Found!");

  return woloo.map((obj: any) => {
    const { image } = obj;

    obj.image = image?.includes(",") ? image.split(",") : [];
    obj.base_url = config.s3imagebaseurl;

    obj.is_safe_space = createLabelValue(obj.is_safe_space);
    obj.is_covid_free = createLabelValue(obj.is_covid_free);
    obj.is_clean_and_hygiene = createLabelValue(obj.is_clean_and_hygiene);
    obj.is_sanitary_pads_available = createLabelValue(obj.is_sanitary_pads_available);
    obj.is_makeup_room_available = createLabelValue(obj.is_makeup_room_available);
    obj.is_coffee_available = createLabelValue(obj.is_coffee_available);
    obj.is_sanitizer_available = createLabelValue(obj.is_sanitizer_available);
    obj.is_feeding_room = createLabelValue(obj.is_feeding_room);
    obj.is_washroom = createLabelValue(obj.is_washroom, "Western", "Indian");
    obj.is_premium = createLabelValue(obj.is_premium);
    obj.is_franchise = createLabelValue(obj.is_franchise);
    obj.is_wheelchair_accessible = createLabelValue(obj.is_wheelchair_accessible);
    obj.status = createLabelValue(obj.status, "ACTIVE", "INACTIVE");
    obj.restaurant = createLabelValue(obj.restaurant == "1");
    obj.segregated = createLabelValue(obj.segregated == "1");
    obj.host_owner = obj.description;

    return obj;
  });
};

const wolooEngagementCount = async (wolooId: any) => {
  try {
    let engagementCount = await new WolooHostModel().wolooEngagementCount(
      wolooId
    );

    let data: { [key: string]: any } = {
      like: 0,
      share: 0,
    };
    if (engagementCount.length < 0) throw new Error("Record not found ");

    if (engagementCount && engagementCount.length > 0) {
      for (var i = 0; i < engagementCount.length; i++) {
        let name = engagementCount[i].engagement_type;
        let count = engagementCount[i].total;
        data[name] = count;
      }
    }

    return data;
  } catch (err) {
    return err;
  }
};

const userCoins = async (userId: number) => {
  try {
    const creditAmount = await new WolooHostModel().creditAmount(userId);
    const debitAmount = await new WolooHostModel().debitAmount(userId);
    let totalCoins = creditAmount[0].creditAmount - debitAmount[0].debitAmount;
    const totalGiftCoins = await new WolooHostModel().giftCoinsCalculation(
      userId
    );
    return {
      totalCoins: totalCoins ?? 0,
      totalGiftCoins: totalGiftCoins[0].gift_points ?? 0,
    };
  } catch (err) {
    return err;
  }
};

const submitReview = async (
  user_id: number,
  woloo_id: number,
  rating: any,
  review_description: string,
  rating_option: string
) => {
  try {
    let review = {
      user_id,
      woloo_id,
      rating,
      rating_option,
      review_description,
    };
    let isWolooExist = await new WolooHostModel().isWolooExist(woloo_id);
    if (!isWolooExist.length) return new Error("woloo id does not exist!");
    let submitReview = await new WolooHostModel().submitReview(review);
    if (submitReview.affectedRows == 0)
      return new Error("Something went wrong ! ");
    try {
      await new WolooHostModel().updateFlag(user_id, woloo_id, 1);
    } catch (e) {
      return e;
    }
    try {
      let message: any;
      message = await new WolooGuestModel().getMessage();
      let getUserDetails = await new WolooGuestModel().getUserByID(user_id);
      if (getUserDetails) {
        // getUserDetails = getUserDetails[0];
        if (getUserDetails.email && getUserDetails.email !== "") {
          const data1 = {
            to: getUserDetails.email,
            from: "info@woloo.in",
            from_name: "Woloo",
            subject: "Woloo - Rate Experience",
            text: message[0].value,
          };
          const transporter = nodemailer.createTransport({
            port: 587, // true for 465, false for other ports
            host: config.email.hostname,
            tls: { rejectUnauthorized: false },
            debug: true,
            auth: {
              type: "LOGIN",
              user: config.email.email_user,
              pass: config.email.email_pass,
            },
          });
          const emailStatus = await transporter.sendMail(data1);
          if (emailStatus.accepted.length && emailStatus.accepted.length > 0) {
            return "Review submitted !";
          }
        } else if (getUserDetails.mobile && getUserDetails.mobile !== "") {
          const mobileNumber = getUserDetails.mobile;
          let smsApi = await new WolooGuestModel().getSmsApi();
          const finalUrl = `${smsApi[0].value}&tempid=${smsTemplate.smsTemplate.SUBMIT_REVIEW}&mobiles=${mobileNumber}&sms=${message[0].value}`;
          const sendSms = await SMS.sendRaw(
            mobileNumber,
            message[0].value,
            smsTemplate.smsTemplate.SUBMIT_REVIEW
          );
          if (sendSms.smslist.sms.status == "success") {
            return "Review submitted !";
          } else {
            return "Something went wrong !";
          }
        }
      }
    } catch (e) {
      return e;
    }
  } catch (err) {
    return err;
  }
};
const ReportToilet = async (user_id: number, woloo_id: number, rating: any, review_description: string, rating_option: string) => {
  try {
    let review = {
      user_id,
      woloo_id,
      rating,
      rating_option,
      review_description,
    };
    let submitReview = await new WolooHostModel().submitReview(review);
    if (submitReview.affectedRows == 0) {
      return new Error("Something went wrong ! ");
    }
    return "Review submitted !";
  } catch (err) {
    return err;
  }
};
const wolooRewardHistory = async (
  userId: any,
  limit: number,
  offset: number
) => {
  try {
    let getHistoryCount;
    let wolooRewardHistory = await new WolooHostModel().wolooRewardHistory(
      userId,
      limit,
      offset
    );
    let nextPage = 0;
    let wolooRewardHistoryCount = wolooRewardHistory.length;
    if (!wolooRewardHistory.length) return new Error("Record not found ");
    if (wolooRewardHistory.length) {
      getHistoryCount = await new WolooHostModel().getHistoryCount(userId);
      if (wolooRewardHistoryCount > offset + limit) {
        nextPage = offset + 1;
      }

      for (var i = 0; i < wolooRewardHistory.length; i++) {
        try {
          if (wolooRewardHistory[i]["image"] !== "") {
            wolooRewardHistory[i]["image"] = JSON.parse(
              wolooRewardHistory[i]["image"].replace(/'/g, '"')
            );
          } else {
            wolooRewardHistory[i]["image"] = [];
          }
        } catch (e) {
          console.log(e);
        }
        const ratings = await new WolooHostModel().UserWolooRating(
          wolooRewardHistory[i]["id"],
          1
        );
        const ratingSum: number = ratings.reduce(
          (sum: number, rating: any) => sum + rating.rating,
          0
        );

        const averageRating =
          ratings.length > 0 ? ratingSum / ratings.length : null;
        wolooRewardHistory[i]["user_rating"] = averageRating
          ? averageRating.toFixed(2)
          : null;
        wolooRewardHistory[i]["is_liked"] = 0;

        const reviewCount = await new WolooHostModel().UserWolooRatingCount(
          wolooRewardHistory[i]["id"],
          1
        );
        wolooRewardHistory[i]["user_review_count"] =
          reviewCount[0]?.reviewCount;
        wolooRewardHistory[i].base_url = config.s3imagebaseurl;
      }
    }

    let lastpage = Math.ceil(getHistoryCount.length / limit);
    wolooRewardHistory = wolooRewardHistory.map((item: any) => ({
      id: item.id,
      woloo_id: item.woloo_id,
      user_id: item.user_id,
      amount: item.amount,
      type: item.type,
      is_review_pending: item.is_review_pending,
      created_at: moment(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
      updated_at: moment(item.updated_at).format("YYYY-MM-DD HH:mm:ss"),
      woloo_details: {
        id: item.id,
        code: item.code,
        name: item.name,
        title: item.title,
        image: item.image,
        opening_hours: item.opening_hours,
        restaurant: item.restaurant,
        segregated: item.segregated,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        status: item.status,
        user_id: item.woloo_user_id,
        description: item.description,
        deleted_at: item.deleted_at,
        is_covid_free: item.is_covid_free,
        is_safe_space: item.is_safe_space,
        is_clean_and_hygiene: item.is_clean_and_hygiene,
        is_sanitary_pads_available: item.is_sanitary_pads_available,
        is_makeup_room_available: item.is_makeup_room_available,
        is_coffee_available: item.is_coffee_available,
        is_sanitizer_available: item.is_sanitizer_available,
        is_feeding_room: item.is_feeding_room,
        is_wheelchair_accessible: item.is_wheelchair_accessible,
        is_washroom: item.is_washroom,
        is_premium: item.is_premium,
        is_franchise: item.is_franchise,
        pincode: item.pincode,
        recommended_by: item.recommended_by,
        recommended_mobile: item.recommended_mobile,
        is_new: item.is_new,
        rating: item.rating,
        user_rating: item.user_rating,
        is_liked: item.is_liked,
        user_review_count: item.user_review_count,
      },
    }));
    var response = {
      total_count: getHistoryCount.length,
      last_page: lastpage,
      history_count: wolooRewardHistoryCount,
      history: wolooRewardHistory,
    };

    return response;
  } catch (err) {
    return err;
  }
};

const wolooLike = async (userId: any, wolooId: any, like: number) => {
  try {
    let woloo;
    woloo = await new WolooHostModel().wolooLike(userId, wolooId, like);
    let message = like ? "Woloo liked" : "Woloo unliked";
    if (woloo.affectedRows) return message;
    woloo = await new WolooHostModel().CreatewolooLike(userId, wolooId, like);
    if (woloo.affectedRows) return message;

    throw new Error("Something went wrong !");
  } catch (err) {
    return err;
  }
};

const fetchWolooHostCount = async (query: any) => {
  let total = await new WolooHostModel().getWolooHostCount(query);
  return total[0].count;
};

const fetchWolooHostById = async (id: any) => {
  let woloo;
  woloo = await new WolooHostModel().getWolooHostById(id);
  //let user_woloo_rating = await new WolooHostModel().getuserWolooRating(id);
  let wolooTime = await new WolooHostModel().getWolooBusinessHours(id);

  if (woloo.length < 1) return Error("Record Not Found !");
  let {
    code,
    name,
    title,
    image,
    mobile,
    email,
    opening_hours,
    restaurant,
    segregated,
    address,
    city,
    lat,
    lng,
    user_id,
    status,
    description,
    created_at,
    updated_at,
    deleted_at,
    is_covid_free,
    is_safe_space,
    is_clean_and_hygiene,
    is_sanitary_pads_available,
    is_makeup_room_available,
    is_coffee_available,
    is_sanitizer_available,
    is_feeding_room,
    is_wheelchair_accessible,
    is_washroom,
    is_premium,
    is_franchise,
    pincode,
    recommended_by,
    recommended_mobile,
    is_new,
    rating,
  } = woloo[0];

  // console.log(image, " ----");

  let imageArray = image ? eval(image)[0].split(",") : [];
  // console.log(imageArray, " #####");
  // console.log(" mobile,email", mobile, email)
  return {
    id,
    code,
    mobile,
    email,
    name,
    title,
    image: imageArray,
    opening_hours: wolooTime,
    address,
    city,
    lat,
    lng,
    user_id,
    description,
    is_new,
    created_at,
    updated_at,
    deleted_at,
    pincode,
    recommended_by,
    recommended_mobile,
    rating,
    // base_url: is_new ? config.s3imagebaseurl : config.wolooimagebaseurl,
    base_url: config.s3imagebaseurl,

    status: status
      ? { label: "ACTIVE", value: 1 }
      : { label: "INACTIVE", value: 0 },
    restaurant:
      restaurant == "1"
        ? { label: "YES", value: restaurant }
        : { label: "NO", value: restaurant },

    is_safe_space: is_safe_space
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_covid_free: is_covid_free
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_clean_and_hygiene: is_clean_and_hygiene
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_sanitary_pads_available: is_sanitary_pads_available
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_makeup_room_available: is_makeup_room_available
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_coffee_available: is_coffee_available
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_sanitizer_available: is_sanitizer_available
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_feeding_room: is_feeding_room
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_wheelchair_accessible: is_wheelchair_accessible
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_washroom: is_washroom
      ? { label: "Western", value: 1 }
      : { label: "Indian", value: 0 },
    is_premium: is_premium
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    is_franchise: is_franchise
      ? { label: "YES", value: 1 }
      : { label: "NO", value: 0 },
    segregated:
      segregated == "1"
        ? { label: "YES", value: 1 }
        : { label: "NO", value: 0 },
    host_owner: description,
  };
};

const deleteWolooHostById = async (id: any) => {
  let now = moment(new Date()).format("YYYY-MM-DD HH-mm-ss");

  let woloo = await new WolooHostModel().deleteWolooHostById(id, now);

  if (woloo.affectedRows == 0) return Error("Record Not Found !");
  return { Response: " WOLOO DELETED SUCCESSFULLY" };
};

const updateWolooHost = async (req: any) => {
  try {
    let wolooData, s3Path, response: any, fields: any, files: any;
    // @ts-ignore

    response = await updateWolooHostForm(req);
    if (response instanceof Error) throw response;

    fields = response.fields;

    const {
      id,
      name,
      lat,
      lng,
      address,
      city,
      user_id,
      opening_hours,
      restaurant,
      segregated,
      is_franchise,
      description,
      status,
      pincode,
      recommended_by,
      recommended_mobile,
      is_covid_free,
      is_safe_space,
      is_clean_and_hygiene,
      is_sanitary_pads_available,
      is_makeup_room_available,
      is_coffee_available,
      is_sanitizer_available,
      is_feeding_room,
      is_wheelchair_accessible,
      is_washroom,
      is_premium,
      title,
      rating,
      email,
      mobile,
    } = fields;

    s3Path = response.s3Path;

    let Woloos: any = {};

    if (!name) throw new Error("Please enter your name");
    Woloos.name = name;

    if (!lat) throw new Error("Please enter latitude field");
    Woloos.lat = lat;

    if (!lng) throw new Error("Please enter longitude field");
    Woloos.lng = lng;
    if (!title) throw new Error("Please enter title field");
    Woloos.title = title;

    if (!address) throw new Error("Please enter your address");
    Woloos.address = address;

    if (!city) throw new Error("Please enter your city");
    Woloos.city = city;

    if (!restaurant) throw new Error("restaurant field required");
    Woloos.restaurant = restaurant;

    if (!segregated) throw new Error("segregated field required");
    Woloos.segregated = segregated;
    // if (!email) throw new Error("email field required");
    Woloos.email = email;

    if (!mobile) throw new Error("mobile field required");

    Woloos.mobile = mobile;
    if (description) Woloos.description = description;

    if (!is_franchise) throw new Error("is_franchise field required");
    Woloos.is_franchise = is_franchise;

    if (!status) throw new Error("status  field required");
    Woloos.status = status;

    const woloo = (await new WolooHostModel().getWolooHostById(id))[0];
    if (status == 1 && (!woloo.code || woloo.code == "")) {
      Woloos.code =
        "WH" +
        city.toString().substr(0, 3).toUpperCase() +
        Math.floor(Math.random() * 90000);
    }

    if (!pincode) throw new Error("Please enter your pincode");
    Woloos.pincode = pincode;

    if (recommended_by) Woloos.recommended_by = recommended_by;

    if (rating) Woloos.rating = rating;

    if (recommended_mobile) Woloos.recommended_mobile = recommended_mobile;

    if (!is_covid_free) throw new Error("is_covid_free field required");
    Woloos.is_covid_free = is_covid_free;

    if (!is_safe_space) throw new Error("is_safe_space field required");
    Woloos.is_safe_space = is_safe_space;

    if (!is_clean_and_hygiene)
      throw new Error("is_clean_and_hygiene  field required");
    Woloos.is_clean_and_hygiene = is_clean_and_hygiene;

    if (!is_sanitary_pads_available)
      throw new Error("is_sanitary_pads_available field required");
    Woloos.is_sanitary_pads_available = is_sanitary_pads_available;

    if (!is_makeup_room_available)
      throw new Error("is_makeup_room_available field required");
    Woloos.is_makeup_room_available = is_makeup_room_available;

    if (!is_coffee_available)
      throw new Error("is_coffee_available field required");
    Woloos.is_coffee_available = is_coffee_available;

    if (!is_sanitizer_available)
      throw new Error("is_sanitizer_available  field required");
    Woloos.is_sanitizer_available = is_sanitizer_available;

    if (!is_feeding_room) throw new Error("is_feeding_room  field required");
    Woloos.is_feeding_room = is_feeding_room;

    if (!is_wheelchair_accessible)
      throw new Error("is_wheelchair_accessible field required");
    Woloos.is_wheelchair_accessible = is_wheelchair_accessible;

    if (!is_washroom) throw new Error("is_washroom  field required");
    Woloos.is_washroom = is_washroom;

    if (!is_premium) throw new Error("is_premium  field required");
    Woloos.is_premium = is_premium;

    if (s3Path.length > 0) {
      Woloos.image = s3Path.toString();

      Woloos.image = "['" + s3Path.toString() + "']";
    }
    Woloos.is_new = 1;
    wolooData = await new WolooHostModel().updateWolooHost(Woloos, id);
    if (opening_hours) {
      let openingHours = JSON.parse(opening_hours);
      await updateWolooBusinessHours(openingHours, id);
    }

    if (wolooData.affectedRows == 0) return Error("Record Not Found !");

    return { MESSAGE: "WOLOO UPDATED SUCCESSFULLY" };
  } catch (e) {
    throw e;
  }
};

const updateWolooHostForm = async (req: any) => {
  let s3Path: any = [];
  const form = new formidable.IncomingForm({ multiples: true });
  return new Promise((resolve, reject) => {
    form.parse(req, async (err: any, fields: any, files: any) => {
      try {
        if (files && files.image) {
          let images: any = files.image;

          const uploadImage = async (image: any) => {
            const imageName = moment().unix() + "_" + image.originalFilename;
            let name: string = "Images/" + "WolooHost" + "/" + imageName;

            const result = await uploadFile(image, name);

            if (result == 0 && result == undefined)
              throw new Error("file upload to s3 failed");

            s3Path.push(result.key);
          };
          if (images.length == undefined) {
            await uploadImage(images);
          } else {
            for (let i = 0; i < images.length; i++) {
              await uploadImage(images[i]);
            }
          }
        }
        resolve({ fields: fields, s3Path: s3Path });
      } catch (e) {
        throw e;
      }
    });
  });
};

const processWolooHostForm = async (req: any) => {
  let s3Path: any = [];
  const form = new formidable.IncomingForm({ multiples: true });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err: any, fields: any, files: any) => {
      // try {
      if (Object.entries(files).length === 0) {
        s3Path = [];
      } else {
        const images: any = files.image;

        const uploadImage = async (image: any) => {
          const imageName = moment().unix() + "_" + image.originalFilename;

          let name: string = "Images/" + "WolooHost" + "/" + imageName;

          const result = await uploadFile(image, name);

          if (result == 0 && result == undefined)
            return Error("file upload to s3 failed");

          s3Path.push(result.key);
        };
        if (images.length == undefined) {
          await uploadImage(images);
        } else {
          for (let i = 0; i < images.length; i++) {
            await uploadImage(images[i]);
          }
        }
      }

      resolve({ fields: fields, s3Path: s3Path });
      // } catch (e) {
      //   throw e;
      // }
    });
  });
};

const fetchNearByWoloo = async (
  lat: any,
  lng: any,
  raduis: number,
  mode: number,
  isSearch: number,
  user_id: number,
  is_offer: number,
  showAll: number = 0,
  gmaps_api_key_var?: string
) => {
  try {
    // Determine query based on showAll and is_offer parameters
    let result;
    const wolooLimit = isSearch ? 50 : 10;

    // Get appropriate query based on conditions
    if (showAll === 1) {
      result = await new WolooHostModel().nearByWolooHostShowAllOffer(
        lat, lng, raduis, wolooLimit
      );
    } else if (showAll === 2) {
      result = await new WolooHostModel().nearByWolooHostWithOfferAndOpenStatus(
        lat, lng, raduis, wolooLimit
      );
    } else {
      result = await new WolooHostModel().nearByWolooHostSearch(
        lat, lng, raduis, wolooLimit
      );
    }

    if (!result || !result.length) {
      return [];
    }

    // Process woloos in parallel
    const processedWoloos = await Promise.all(
      result.map(async (woloo: any) => {
        try {
          // Set woloo type
          woloo.woloo_type = woloo.restaurant === "-1" ? "Powder Room" : "Woloo Host";

          // Get ratings in parallel
          const [avgRating, ratingPercentage] = await Promise.all([
            new WolooHostModel().getuserWolooRating(woloo.id),
            new WolooHostModel().wolooRatingPercentage()
          ]);

          // Calculate average rating
          const avg_woloo_rating = Math.min(5,
            +avgRating[0].rating +
            +ratingPercentage[0].value / 100 +
            (+avgRating[0].user_rating + +ratingPercentage[1].value / 100)
          );

          // Get distance and duration
          const transportMode = MapMode[mode].toString();
          const res = await Map.fetchDistance(
            `${lat},${lng}`,
            `${woloo.lat},${woloo.lng}`,
            transportMode,
            gmaps_api_key_var
          );

          // Set distance and duration
          woloo.travelMode = transportMode;
          woloo.distance = res.distance >= 0 ? `${(res.distance / 1000).toFixed(2)} KM` : "N/A";
          woloo.duration = res.duration >= 0
            ? `${Math.floor(res.duration / 60)}.${res.duration % 60} Min`
            : "N/A";
          woloo.distance_mtr = res.distance >= 0 ? res.distance : "N/A";
          woloo.duration_sec = res.duration >= 0 ? res.duration : "N/A";

          // Process offer if exists
          if (is_offer && woloo.offer) {
            woloo.offer = JSON.parse(woloo.offer);
            if (woloo.offer) {
              woloo.offer.offer_base_url = config.s3imagebaseurl;
            }
          } else {
            delete woloo.offer;
          }

          // Set base URL and process image
          woloo.base_url = config.s3imagebaseurl;
          woloo.image = woloo.image ? eval(woloo.image)[0].split(",") : [];
          woloo.user_review_count = woloo.user_review_count || 0;

          // Get user engagement
          const wolooEngagement = await new WolooHostModel().userWolooEnagement(user_id, woloo.id);
          woloo.is_liked = wolooEngagement[0]?.engagement_type === "like" && wolooEngagement[0]?.is_active === 1 ? 1 : 0;

          // Calculate rating and cibil score
          const rating = Math.ceil(!avg_woloo_rating || avg_woloo_rating < 3 ? 3 : avg_woloo_rating);
          woloo.user_rating = rating;
          woloo.cibil_score = constant.cibil_score[String(rating) as keyof typeof constant.cibil_score];

          // Set cibil score image and color
          const { POOR, FAIR, GOOD, GREAT, EXCELLENT } = constant.cibil_score_colour;
          const { cibilScoreImageBaseUrl } = config;
          const cibilScoreMap = {
            1: { image: 'poor.png', color: POOR },
            2: { image: 'fair.png', color: FAIR },
            3: { image: 'good.png', color: GOOD },
            4: { image: 'very_good.png', color: GREAT },
            5: { image: 'excellent.png', color: EXCELLENT }
          } as const;

          const scoreInfo = cibilScoreMap[rating as keyof typeof cibilScoreMap];
          woloo.cibil_score_image = `${cibilScoreImageBaseUrl}/Cibil_Images/${scoreInfo.image}`;
          woloo.cibil_score_colour = scoreInfo.color;

          return woloo;
        } catch (error) {
          throw error;
        }
      })
    );

    // Filter out failed processing and sort results
    return _.orderBy(
      // processedWoloos.filter(woloo => woloo && woloo.distance_mtr !== -1),
      processedWoloos,
      ["user_rating", "duration_sec", "distance_mtr"],
      ["desc", "asc", "asc"]
    );
  } catch (error) {
    throw error;
  }
};

const fetchBulkUploadFiles = async (): Promise<any> => {
  try {
    const params = {
      Bucket: config.S3.bucketName,
      Prefix: "Host-Bulk-Upload-Files/",
    };

    const response = await getListOfObjectsInS3Bucket(params);

    const threeMonthsAgo = moment()
      .subtract(3, "months")
      .startOf("day")
      .toDate();

    // Filter files by last modified date within the last three months
    const recentFiles = response.Contents.filter(
      (file: any) => file.LastModified >= threeMonthsAgo
    );

    // Generate presigned URLs for each file
    const filesWithUrls = await Promise.all(
      recentFiles.map(async (file: any) => {
        const url = await getPresignedDownloadUrl(file.Key);
        return {
          name: file.Key.split("/").pop(),
          url: url,
          date: file.LastModified,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          size: file.Size,
        };
      })
    );

    return filesWithUrls;
  } catch (error) {
    console.error("Error fetching bulk upload files:", error);
    throw error;
  }
};

const updateWolooBusinessHours = async (
  businessHours: Array<any>,
  id: number
) => {
  try {
    await new WolooHostModel().updateBusinessHour({ status: 0 }, id);
    await Promise.all(
      businessHours.map(async (businessHour: any) => {
        await new WolooHostModel().insertBusinessHours({
          woloo_id: id,
          open_time: businessHour.start_time,
          close_time: businessHour.end_time,
          status: 1,
        });
      })
    );
  } catch (e) {
    return e;
  }
};

// Gift Subscription

const addCoinsService = async (
  coins: number,
  mobile: any,
  message: any,
  userId: number
) => {
  try {
    if (!userId) throw new Error("User id is required!");

    const sendersUserId = (
      await new BaseModel()._executeQuery(
        `select id from users where mobile = ?`,
        [mobile]
      )
    )[0];
    if (!sendersUserId) throw new Error("User not found");

    const getCoinValue = (
      await new WolooGuestModel().getSettings("site.1_point_value")
    )[0];
    if (!getCoinValue) throw new Error("site.1_point_value not found");

    const amount = coins * getCoinValue.value * 100;
    let order = await razorpay.createOrder(amount);

    if (!order) throw new Error("Error while creating order.");
    if (order.status != "created") throw new Error("Order creation failed.");

    const transaction = await new Transactions().userRazorpay({
      user_id: userId,
      sender_id: sendersUserId.id,
      message: message,
      order_id: order.id,
      coins: coins,
      status: 0,
      initial_razopay_response: JSON.stringify(order),
      created_at: new Date(Date.now()),
      updated_at: new Date(Date.now()),
    });

    if (!transaction) throw new Error("Error while creating transaction.");
    if (transaction.affectedRows == 0)
      throw new Error("Error while inserting transaction");

    return { order_id: order.id };
  } catch (e: any) {
    if (typeof e === "object" && e.error)
      throw new Error(`RZP : ${e.error.description}`);
    throw e;
  }
};

const addCoinsWebhookService = async (
  orderId: any,
  paymentId: any,
  status: any,
  future: any,
  response: any
) => {
  if (!orderId || !paymentId || status !== "captured") {
    return { error: "Invalid transaction details or status." };
  }

  const transaction = await new Transactions().fetchUserRazorpay(orderId);
  if (!transaction.length) throw new Error("Transaction not found");
  if (transaction[0].webhook_razopay_response)
    return { message: "Coins already added" };

  try {
    const user = await new WolooGuestModel().getWolooGuestById(
      transaction[0].user_id
    );
    if (!user) throw new Error("Invalid User");
    const result = transaction[0].subscription_id
      ? await handleSubscriptionTransaction(transaction[0], user, future)
      : await handleNonSubscriptionTransaction(transaction[0]);

    await new Transactions().updateUserRazorpay(
      {
        status: 1,
        webhook_razopay_response: JSON.stringify(response),
        updated_at: new Date(),
      },
      transaction[0].order_id
    );
    return { message: "Coins added successfully", details: result };
  } catch (error) {
    console.error("Error processing transaction:", error);
    throw error;
  }
};

async function handleSubscriptionTransaction(
  transaction: any,
  user: any,
  future: any
) {
  const subscription = await new SubscriptionModel().fetchSubscriptionById(
    transaction.subscription_id
  );
  const days = common.convertToDaysAndMonths(subscription.days);
  const expire_date = common.calculateExpiryDate(
    user.expire_date,
    days,
    future
  );

  await new WolooGuestModel().updateWolooGuest(
    {
      expiry_date: expire_date,
      voucher_id: null,
      subscription_id: subscription.id,
    },
    user.id
  );

  return "Subscription updated.";
}

async function handleNonSubscriptionTransaction(transaction: any) {
  try {
    if (transaction.user_id && transaction.sender_id) {
      const walletResult = await updateWalletForNonSubTransaction(
        transaction,
        transaction.user_id,
        transaction.sender_id
      );
      return (
        "Non-subscription transaction updated and wallet updated: " +
        walletResult
      );
    }
  } catch (error) {
    console.log(
      "Error updating wallet for non-subscription transaction:",
      error
    );
    return error;
  }
}

async function generateDynamicLink(transactionId: any) {
  const data = JSON.stringify({
    dynamicLinkInfo: {
      domainUriPrefix: config.firebaseLink.domainUriPrefix,
      link: `https://app.woloo.in?giftId=${transactionId}`,
      androidInfo: {
        androidPackageName: config.firebaseLink.androidPackageName,
      },
      iosInfo: {
        iosBundleId: config.firebaseLink.iosBundleId,
      },
    },
  });

  const fburl = config.firebaseLink.url;
  const response = await HttpClient.api("POST", fburl, { data });
  return response.shortLink.split("https://")[1];
}

async function updateWalletForNonSubTransaction(
  transaction: any,
  senderId: any,
  receiverId: any
) {
  const sender = (await new WolooGuestModel().getWolooGuestById(senderId))[0];
  const receiver = (
    await new WolooGuestModel().getWolooGuestById(receiverId)
  )[0];

  const giftCoins = Number(transaction.coins);

  // Credit transaction for receiver
  const wallet_txn = await new WalletModel().createWallet({
    user_id: receiverId,
    sender_receiver_id: senderId,
    transaction_type: "CR",
    remarks: `Received Gift From ${sender.name || sender.mobile}`,
    value: giftCoins,
    type: "Gift Received",
    is_gift: 1,
    message: transaction.message,
    status: 1,
  });

  // Debit transaction for sender
  // await new WalletModel().createWallet({
  //   user_id: senderId,
  //   sender_receiver_id: receiverId,
  //   transaction_type: "DR",
  //   remarks: `Gift Sent To ${receiver.name || receiver.mobile}`,
  //   value: giftCoins,
  //   type: "Gift Sent",
  //   is_gift: 1,
  //   message: transaction.message,
  //   status: 1,
  // });

  // Generate dynamic link for the gift
  const shortLink = await generateDynamicLink(wallet_txn.insertId);

  // Send SMS to receiver and sender
  const receiverMessage = `Hi Dear, ${sender.name || sender.mobile
    } has gifted you with a gift card worth of Rs.${giftCoins}. Below is the message shared by ${sender.name || sender.mobile
    }. ${transaction.message
    } The gift card can be redeemed in the Woloo App. Download the App & locate clean, safe & hygienic washrooms near you. Download App - ${shortLink} Go Bindass! #WolooHaiNa LOOM & WEAVER RETAIL`;
  await SMS.sendRaw(receiver.mobile, receiverMessage, "1707168310155892977");

  const senderMessage = `Hi, ${receiver.name || receiver.mobile
    } has received the gift card sent by you, You will be getting Woloo Points worth Rs.${giftCoins}. These points can be used in the Woloo App for Shopping. Go Bindass! #WolooHaiNa LOOM & WEAVER RETAIL`;
  await SMS.sendRaw(sender.mobile, senderMessage, "1707168234129978498");

  // console.log("Wallet transactions completed for both parties.");
  return "Wallet updated";
}

const getNearByWolooAndOfferCount = async (
  lat: any,
  lng: any,
  radius: number = 2,
  page: number = 1
) => {
  let limit = 10,
    offset = 5;
  let settingRadius = await new WolooHostModel().getSettingradius();
  let per_page = await new WolooHostModel().nearby_woloo_per_page();
  let offerCount = await new WolooHostModel().getOfferCount();
  let shopOffer: any = [];
  limit = Number(per_page[0].value);
  offset = (page - 1) * limit;

  radius = radius > settingRadius[0].value ? settingRadius[0].value : radius;
  limit = 5;
  let woloo = await new WolooHostModel().nearByWolooAndOfferCount(
    lat,
    lng,
    radius,
    limit,
    offset
  );
  let count = woloo.length || 0;

  //   let url="https://shop.woloo.in/app_api/get_coupon_code_list_api.php"

  //    shopOffer=new Promise((resolve, reject) => {
  //     HttpClient.api('get', url, {
  //         params:
  //             { CURLOPT_RETURNTRANSFER: true, CURLOPT_ENCODING: "", CURLOPT_MAXREDIRS: 10, CURLOPT_TIMEOUT: 0, CURLOPT_FOLLOWLOCATION: true, responsein:'json' }
  //     })
  //         .then(function (response: any) {
  //             resolve(response);
  //         })
  //         .catch(function (error: Error) {
  //             reject(error);
  //         })
  // });
  // shopOffer.then((e)=>console.log(e))
  // console.log("shopOffer",)

  return {
    wolooCount: count,
    offerCount: offerCount[0].count,
    shopOffer: shopOffer,
  };
};
const ownerHistory = async (
  pageIndex: any,
  pageSize: any,
  sort: any,
  isPaginated: boolean,
  query: any
) => {
  let orderQuery: string;
  if (sort.key != "") {
    orderQuery = " ORDER BY " + sort.key + " " + sort.order + " ";
  } else {
    orderQuery = " ORDER BY id DESC";
  }
  let total = await new WolooHostModel().ownerHistory(
    pageSize,
    (pageIndex - 1) * pageSize,
    orderQuery,
    isPaginated,
    query
  );
  return total;
};
const fetchOwnerHistoryCount = async (sort: any, query: any) => {
  let orderQuery: string;
  if (sort.key != "") {
    orderQuery = " ORDER BY " + sort.key + " " + sort.order + " ";
  } else {
    orderQuery = " ORDER BY id DESC";
  }
  let total = await new WolooHostModel().getOwnerHistoryCount(
    orderQuery,
    query
  );

  return total.length;
};
const recommendWoloo = async (req: any) => {
  try {
    let wolooData, s3Path, response: any, fields: any, files: any;
    // @ts-ignore
    let user_id: any = req.session.id;
    response = await processWolooHostForm(req);
    if (response instanceof Error) throw response;
    fields = response.fields;

    let { name, address, city, lat, lng, pincode, recommended_mobile } =
      response.fields;

    s3Path = response.s3Path;
    if (s3Path.length == 0) {
      return new Error("Please select at least one woloo image");
    }
    let Woloos: any = {};

    if (!name) return new Error("Please enter your name");
    Woloos.name = name;

    if (!lat) return new Error("lat field required");
    Woloos.lat = lat;

    if (!lng) return new Error("lng field required");
    Woloos.lng = lng;

    if (!address) return new Error("Please enter your address");
    Woloos.address = address;

    if (!city) return new Error("Please enter your city");
    Woloos.city = city;

    if (!recommended_mobile) throw new Error("Please enter recommended_mobile");
    Woloos.recommended_mobile = recommended_mobile;

    Woloos.code =
      "WH" +
      fields.city.toString().substr(0, 3).toUpperCase() +
      Math.floor(Math.random() * 90000);
    // Woloos.status = 1;
    if (!pincode) throw new Error("pincode field required");
    Woloos.pincode = pincode;
    Woloos.recommended_by = user_id;
    if (recommended_mobile) Woloos.recommended_mobile = recommended_mobile;
    Woloos.is_new = 1;
    Woloos.image = "['" + s3Path.toString() + "']";
    Woloos.is_franchise = 1;
    wolooData = await new WolooHostModel().createWolooHost(Woloos);
    if (wolooData.affectedRows == 0) throw new Error("Registration failed");
    return {
      insertId: wolooData.insertId,
      affectedRows: wolooData.affectedRows,
    };
  } catch (e) {
    return e;
  }
};
const userRecommendWoloo = async (req: any) => {
  try {
    let wolooData;
    let base_url;
    // @ts-ignore
    let user_id: any = req.session.id;
    wolooData = await new WolooHostModel().userRecommendWoloo(user_id);
    if (!wolooData) throw new Error("something went wrong");
    wolooData = wolooData.map((woloo: any) => {
      // woloo.image=JSON.parse(woloo.image)
      woloo.image = eval(woloo.image)[0].split(",");
      // woloo.base_url = woloo.is_new
      //   ? config.s3imagebaseurl
      //   : config.wolooimagebaseurl;
      woloo.base_url = config.s3imagebaseurl;
      return woloo;
    });
    // base_url: is_new ? config.s3imagebaseurl : config.wolooimagebaseurl,

    return wolooData;
  } catch (e) {
    return e;
  }
};
const getSettingValue = async () => {
  try {
    let settingValue = await new WolooHostModel().getSettingValue();
    return settingValue[0].value;
  } catch (e) {
    return e;
  }
};

const getNewWoloo = async () => {
  try {
    let newWoloo = await new WolooHostModel().getNewWoloo();
    return newWoloo[0].id;
  } catch (e) {
    return e;
  }
};

const updateDevicePayload = async (
  deviceId: number,
  type: any,
  ppm: any,
  org_name: any,
  location_name: any,
  sub_location: any,
  ppm_time: any
) => {
  let result = await new WolooHostModel().insertdevicePayload(
    deviceId,
    type,
    ppm,
    org_name,
    location_name,
    sub_location,
    ppm_time
  );
  return result;
};

const enrouteService = async (
  overview_polyline: any,
  user_id: number,
  src_lat: any,
  src_lng: any,
  mode: number,
  agent: any,
  gmaps_api_key_var?: string
) => {
  try {
    // Decode polyline and create route box
    const polylineArray = polyline.decode(overview_polyline.points);
    const routeBox: Array<any> = rboxer.mkBox(polylineArray, 0.4);

    // Build query for enroute woloos
    let query = " WHERE w.status = 1 AND";
    map(routeBox, function (point, index) {
      query += ` (w.lat between ${point[0][0]} AND ${point[1][0]} AND w.lng between ${point[0][1]} AND ${point[1][1]}) `;
      if (routeBox.length - 1 != index) query += " OR ";
    });

    // Fetch enroute woloos
    const result = await new WolooHostModel().enrouteWoloo(query);
    if (!result || !result.length) {
      return [];
    }

    // Process woloos in parallel
    const processedWoloos = await Promise.all(
      result.map(async (woloo: any) => {
        try {
          // Set woloo type
          woloo.woloo_type = woloo.restaurant === "-1" ? "Powder Room" : "Woloo Host";
          woloo.user_id = woloo.user_id?.toString() || woloo.user_id;

          // Get ratings in parallel
          const [avgRating, ratingPercentage] = await Promise.all([
            new WolooHostModel().getuserWolooRating(woloo.id),
            new WolooHostModel().wolooRatingPercentage()
          ]);

          // Calculate average rating
          const avg_woloo_rating = Math.min(5,
            +avgRating[0].rating +
            +ratingPercentage[0].value / 100 +
            (+avgRating[0].user_rating + +ratingPercentage[1].value / 100)
          );

          // Get distance and duration
          const transportMode = MapMode[mode].toString();
          const res = await Map.fetchDistance(
            `${src_lat},${src_lng}`,
            `${woloo.lat},${woloo.lng}`,
            transportMode,
            gmaps_api_key_var
          );

          // Set distance and duration
          woloo.travelMode = transportMode;
          woloo.distance = res.distance >= 0 ? `${(res.distance / 1000).toFixed(2)} KM` : "N/A";
          woloo.duration = res.duration >= 0
            ? `${Math.floor(res.duration / 60)}.${res.duration % 60} Min`
            : "N/A";
          woloo.distance_mtr = res.distance >= 0 ? res.distance : "N/A";
          woloo.duration_sec = res.duration >= 0 ? res.duration : "N/A";

          // Set base URL and process image
          woloo.base_url = config.s3imagebaseurl;
          woloo.image = woloo.image ? eval(woloo.image)[0].split(",") : [];
          woloo.user_review_count = woloo.user_review_count || 0;
          woloo.recommended_by = woloo.recommended_by?.toString() || "";

          // Get user engagement
          const wolooEngagement = await new WolooHostModel().userWolooEnagement(user_id, woloo.id);
          woloo.is_liked = wolooEngagement[0]?.engagement_type === "like" && wolooEngagement[0]?.is_active === 1 ? 1 : 0;

          // Calculate rating and cibil score
          const rating = Math.ceil(!avg_woloo_rating || avg_woloo_rating < 3 ? 3 : avg_woloo_rating);
          woloo.user_rating = rating;
          woloo.cibil_score = constant.cibil_score[String(rating) as keyof typeof constant.cibil_score];

          // Set cibil score image and color
          const { POOR, FAIR, GOOD, GREAT, EXCELLENT } = constant.cibil_score_colour;
          const { cibilScoreImageBaseUrl } = config;
          const cibilScoreMap = {
            1: { image: 'poor.png', color: POOR },
            2: { image: 'fair.png', color: FAIR },
            3: { image: 'good.png', color: GOOD },
            4: { image: 'very_good.png', color: GREAT },
            5: { image: 'excellent.png', color: EXCELLENT }
          } as const;

          const scoreInfo = cibilScoreMap[rating as keyof typeof cibilScoreMap];
          woloo.cibil_score_image = `${cibilScoreImageBaseUrl}/Cibil_Images/${scoreInfo.image}`;
          woloo.cibil_score_colour = scoreInfo.color;

          return woloo;
        } catch (error) {
          throw error;
        }
      })
    );

    // Filter out failed processing and sort results
    return _.orderBy(
      processedWoloos,
      ["user_rating", "duration_sec", "distance_mtr"],
      ["desc", "asc", "asc"]
    );
  } catch (error) {
    throw error;
  }
};

const getLikeStatus = async (wolooId: any) => {
  try {
    let engagementCount = await new WolooHostModel().wolooEngagementCount(
      wolooId
    );

    let data: { [key: string]: any } = {
      like: 0,
      share: 0,
    };
    if (engagementCount.length < 0) throw new Error("Record not found ");

    if (engagementCount && engagementCount.length > 0) {
      for (var i = 0; i < engagementCount.length; i++) {
        let name = engagementCount[i].engagement_type;
        let count = engagementCount[i].total;
        data[name] = count;
      }
    }

    return data;
  } catch (err) {
    return err;
  }
};
const createWolooWithReportToilet = async (name: any, address: any, city: any, lat: any, lng: any, pincode: any) => {
  try {

    let isWolooToiletExist = await new WolooHostModel().isWolooToiletExist(name, lat, lng);

    if (isWolooToiletExist.length) {
      return {
        wolooId: isWolooToiletExist[0].id,
      };
    }
    let Woloos: any = {};
    Woloos.name = name;
    Woloos.lat = lat;
    Woloos.lng = lng;
    Woloos.address = address;
    Woloos.city = city;
    Woloos.code = "WH" + city.toString().substr(0, 3).toUpperCase() + Math.floor(Math.random() * 90000);
    Woloos.pincode = pincode;
    Woloos.status = 0
    let wolooData = await new WolooHostModel().createWolooHost(Woloos);
    if (wolooData.affectedRows == 0) throw new Error("Registration failed");
    return {
      wolooId: wolooData.insertId
    };
  } catch (e) {
    return e;
  }
};

const getHostDashboardData = async (wolooId: number) => {
  const result: any = {};
  const wolooHostModel = new WolooHostModel();

  // Get userId for the given wolooId
  const userIdResult = await wolooHostModel.getUserIdbyWolooId(wolooId);
  const userId = userIdResult?.[0]?.user_id;
  if (!userId) throw new Error("User not found for the given Woloo ID");

  // Get average ratings and rating percentages
  const [avgWolooRatingArr, ratingPercentages] = await Promise.all([
    wolooHostModel.getuserWolooRating(wolooId),
    wolooHostModel.wolooRatingPercentage()
  ]);
  const avgWolooRating = +avgWolooRatingArr?.[0]?.rating || 0;
  const userRating = +avgWolooRatingArr?.[0]?.user_rating || 0;
  const ratingPercentage1 = +ratingPercentages?.[0]?.value || 0;
  const ratingPercentage2 = +ratingPercentages?.[1]?.value || 0;

  // Calculate the final rating
  let calculatedRating = avgWolooRating + ratingPercentage1 / 100 + userRating + ratingPercentage2 / 100;
  calculatedRating = Math.min(5, calculatedRating);
  const rating = Math.ceil(!calculatedRating || calculatedRating < 3 ? 3 : calculatedRating);

  // Set up constants and image/color selection
  // result.base_url = config.s3imagebaseurl;
  // @ts-ignore
  result.wah_score = constant.cibil_score[rating];

  const { POOR, FAIR, GOOD, GREAT, EXCELLENT } = constant.cibil_score_colour;
  const { cibilScoreImageBaseUrl: wahScoreImageBaseUrl } = config;

  const ratingMap = {
    1: { image: "poor.png", colour: POOR },
    2: { image: "fair.png", colour: FAIR },
    3: { image: "good.png", colour: GOOD },
    4: { image: "very_good.png", colour: GREAT },
    5: { image: "excellent.png", colour: EXCELLENT }
  };

  // @ts-ignore
  const selected = ratingMap[rating] || ratingMap[3];
  result.wah_score_image = `${wahScoreImageBaseUrl}/Cibil_Images/${selected.image}`;
  result.wah_score_colour = selected.colour;

  // Fetch walk-in counts and percentage changes for last 1, 3, and 6 hours in parallel
  const [walkIn1Hr, walkIn3Hr, walkIn6Hr] = await Promise.all([
    wolooHostModel.getWolooWalkIn(userId, wolooId, 1),
    wolooHostModel.getWolooWalkIn(userId, wolooId, 3),
    wolooHostModel.getWolooWalkIn(userId, wolooId, 6)
  ]);
  result.walk_ins_last_1Hr = walkIn1Hr;
  result.walk_ins_last_3Hr = walkIn3Hr;
  result.walk_ins_last_6Hr = walkIn6Hr;

  return result;
};
const updateUserRoleById = async (userID: any) => {
  try {

    let updateUserData = await new WolooHostModel().updateWolooHostUser({
      role_id: 16,
    }, userID);

    if (updateUserData.affectedRows == 0) return Error("Record Not Found !");

    return { MESSAGE: "WOLOO ROLE UPDATED SUCCESSFULLY" };
  } catch (e) {
    return e;
  }
};
const getWolooFacility = async (userID: any) => {
  try {

    let wolooUserData = await new WolooHostModel().getWolooByUserID(userID);
    if (wolooUserData.length == 0)
      return {
        message: "No woloo Found",
      };

    return wolooUserData
  } catch (e) {
    return e;
  }
};
/**
 * Search WolooHosts using the provided query and parameters
 * @param {string} searchQuery - The SQL WHERE clause and conditions
 * @param {Array<any>} queryParams - Array of parameters for the prepared statement
 * @returns {Promise<Array<WolooHost>>} Array of matching WolooHosts with aggregated data
 * @throws {Error} If database query fails
 */
const searchWolooHost = async (searchQuery: string, sortQuery: string, paginationQuery: string, queryParams: any[]) => {
  try {
    const wolooHostModel = new WolooHostModel();
    const result = await wolooHostModel.searchWolooHost(searchQuery, sortQuery, paginationQuery, queryParams);

    // Process each result to add cibil score
    const processedResults = await Promise.all(result.map(async (woloo: any) => {
      // Calculate rating and cibil score
      const rating = Math.ceil(!woloo.average_rating || woloo.average_rating < 3 ? 3 : woloo.average_rating);
      woloo.user_rating = rating;
      woloo.cibil_score = constant.cibil_score[String(rating) as keyof typeof constant.cibil_score];

      // Set cibil score image and color
      const { POOR, FAIR, GOOD, GREAT, EXCELLENT } = constant.cibil_score_colour;
      const { cibilScoreImageBaseUrl } = config;
      const cibilScoreMap = {
        1: { image: 'poor.png', color: POOR },
        2: { image: 'fair.png', color: FAIR },
        3: { image: 'good.png', color: GOOD },
        4: { image: 'very_good.png', color: GREAT },
        5: { image: 'excellent.png', color: EXCELLENT }
      } as const;

      const scoreInfo = cibilScoreMap[rating as keyof typeof cibilScoreMap];
      woloo.cibil_score_image = `${cibilScoreImageBaseUrl}/Cibil_Images/${scoreInfo.image}`;
      woloo.cibil_score_colour = scoreInfo.color;

      return woloo;
    }));

    return processedResults;
  } catch (error) {
    LOGGER.error('Search Service Error:', error);
    throw error;
  }
};

/**
 * Get total count of matching WolooHosts for pagination
 * @param {string} searchQuery - The SQL WHERE clause and conditions
 * @param {Array<any>} queryParams - Array of parameters for the prepared statement
 * @returns {Promise<number>} Total count of matching records
 * @throws {Error} If database query fails
 */
const getSearchCount = async (searchQuery: string, queryParams: any[]) => {
  try {
    const wolooHostModel = new WolooHostModel();
    const result = await wolooHostModel.getSearchCount(searchQuery, queryParams);
    return parseInt(result[0].count);
  } catch (error) {
    LOGGER.error('Search Count Error:', error);
    throw error;
  }
};

export default {
  getWolooFacility,
  updateUserRoleById,
  fetchWolooHost,
  fetchWolooHostCount,
  fetchWolooHostById,
  deleteWolooHostById,
  createWolooHost,
  updateWolooHost,
  fetchNearByWoloo,
  fetchBulkUploadFiles,
  addCoinsService,
  addCoinsWebhookService,
  getNearByWolooAndOfferCount,
  ownerHistory,
  fetchOwnerHistoryCount,
  wolooLike,
  wolooEngagementCount,
  recommendWoloo,
  getSettingValue,
  getNewWoloo,
  userCoins,
  submitReview,
  wolooRewardHistory,
  userRecommendWoloo,
  updateDevicePayload,
  enrouteService,
  addWolooHost,
  createWolooWithReportToilet,
  ReportToilet,
  getHostDashboardData,
  searchWolooHost,
  getSearchCount
};
