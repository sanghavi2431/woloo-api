import crypto from "crypto";
import bcrypt from "bcrypt";
import { WolooGuestModel } from "../Models/WolooGuest.model";
import Encryption from "../utilities/Encryption";
import CommonService from "./CommonService/Guest";
import { ClientAuth } from "../Models/ClientAuth.model";

const makeObjectForLogin = async (user: any, client: any) => {
    const token = await Encryption.generateJwtToken({ id: user.id, role_id: user.role_id, client_id: client.id, client_gmaps_key_var: client.gmaps_api_key_var });
    for (let u in user) {
        if (
            u == "subscription_id" ||
            u == "fb_id" ||
            u == "gp_id" ||
            u === "sponsor_id" ||
            u == "woloo_id" ||
            u == "gift_subscription_id" ||
            u == "status" ||
            u == "settings" ||
            u == "thirst_reminder_hours" ||
            u == "voucher_id"
        ) {
            let value = user[u];
            if (value || value == 0) {
                user[u] = value.toString();
            }
        }
    }
    user["role_id"] = null;
    if (!user["voucher_id"] && Date.parse(user.expiry_date) > Date.now()) {
        user.isFreeTrial = 1;
    } else {
        user.isFreeTrial = 0;
    }
    return {
        user: user,
        token: token,
        user_id: user.id,
    };
}

const clientAuthService = async (mobile: any, svocid: any, client_id: any, client_secret: any) => {
    const user = (await new WolooGuestModel().getUserByMobile(mobile))[0];
    const client = await new ClientAuth().getClientById(client_id);

    if (!client) {
        throw new Error("Invalid Client ID");
    }

    const isSecretValid = await bcrypt.compare(client_secret, client.client_secret);
    if (!isSecretValid) {
        throw new Error("Invalid Client Secret");
    }

    if (user) {
        if (!user.svocid) {
            await new WolooGuestModel().updateWolooGuest({ svocid }, user.id);
            user.svocid = svocid;
        }
        if (user.svocid !== svocid) {
            throw new Error("Invalid SVOCID");
        }
        return await makeObjectForLogin(user, client);
    } else {
        const newUserId = await CommonService.createGuest(mobile, 0, null, null,false);
        await new WolooGuestModel().updateWolooGuest({ svocid }, newUserId);
        const newuser = (await new WolooGuestModel().getWolooGuestById(newUserId))[0];
        return await makeObjectForLogin(newuser, client);
    }
}

const registerClientService = async (client_name: string) => {
    const client_id = crypto.randomBytes(16).toString("hex");
    const client_secret = crypto.randomBytes(32).toString("hex");
    const hashed_secret = await bcrypt.hash(client_secret, 10);
    const gmaps_api_key_var = `${client_name.toUpperCase().replace(/[^A-Z0-9_]/g, "_")}_GMAPS_API_KEY` // Note: Follow this same format to define google map api key for client

    try {
        await new ClientAuth().registerClient(client_name, client_id, hashed_secret, gmaps_api_key_var);
        return { client_id, client_secret };
    } catch (error) {
        console.error(error);
        throw new Error("Unable to register client");
    }
};

export default {
    clientAuthService,
    registerClientService
}