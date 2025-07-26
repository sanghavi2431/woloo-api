import SubscriptionController from "../../Controllers/Subscription.controller";
import { SubscriptionModel } from "../../Models/Subscription.model";
import { VoucherModel } from "../../Models/Voucher.model";
import { WalletModel } from "../../Models/Wallet.model";
import { WolooGuestModel } from "../../Models/WolooGuest.model";
import common from "../../utilities/common";
import constants from "../../Constants/common"
import Hashing from "../../utilities/Hashing";
import { SettingModel } from "../../Models/Setting.model";

const createGuest = async (mobile: any, voucherid: any, email: any, woloo_id: any,isClient:boolean) => {
    try{
    const setting = await new WolooGuestModel().getSettings("site.free_trial_period_days");
    let exp_date = new Date(Date.now());
    if(!isClient){
        exp_date.setDate(exp_date.getDate() + Number(setting[0].value));
    }
    
    if (voucherid) {
        let voucher = (await new VoucherModel().fetchVoucherById(voucherid))[0];
        let sub = (await new SubscriptionModel().fetchSubscriptionById(voucher.subscriptions_id))[0];
        if (sub) {
            const days = (common.convertToDaysAndMonths(sub.days)).days;
            exp_date.setDate(exp_date.getDate() + days);
        }
    }
    const referalCode = common.genRefCode();
    //genearte password
    const plainPassword = Math.random().toString(36).slice(-8); // 8-char random password
    const encodedPassword  = await new Hashing().encrypt(plainPassword);

    let newuser = await new WolooGuestModel().createWolooGuest({
        role_id: isClient ? 13 : null,
        shop_password:encodedPassword,
        mobile: mobile,
        expiry_date: isClient? null: new Date(exp_date).toISOString().split('T')[0],
        ref_code: referalCode,
        is_first_session: 1,
        voucher_id: (voucherid != 0) ? voucherid : null,
        email: email ? email : null,
        woloo_id: woloo_id
    });

    var getRegistartionPoint = await new SettingModel().getRegistartionPoint();

    const walletdata = {
        user_id: newuser.insertId,
        transaction_type: "CR",
        remarks: "Registration Point",
        value: getRegistartionPoint[0]?.value,
        type: "Registration Point",
        is_gift: 0,
    };
    await new WalletModel().createWallet(walletdata);
    if (voucherid != 0) {
        await new VoucherModel().insertUserVoucher({
            user_id: newuser.insertId,
            voucher_code_id: voucherid,
        });
    }
    return newuser.insertId;
}catch(error:any){
    console.log(error)
    throw new Error(error.message);
}
};

const createUser = async (email: any, mobile: any, contact_name: any, password: any, insertId: any, woloo_id: any) => {

    const setting = await new WolooGuestModel().getSettings("site.free_trial_period_days");
    let exp_date = new Date();
    if(woloo_id){
        exp_date.setFullYear(exp_date.getFullYear() + 10);
    }
    else{
        exp_date.setDate(exp_date.getDate() + Number(setting[0].value));
    }

    const referalCode = common.genRefCode();
    let hash = await new Hashing().generateHash(password, 12);
    let newuser = await new WolooGuestModel().createWolooGuest({
        email: email,
        mobile: mobile,
        name: contact_name,
        expiry_date: new Date(exp_date).toISOString().split('T')[0],
        ref_code: referalCode,
        role_id: woloo_id ? constants.rbac?.role_id?.host_id : constants.rbac?.role_id?.corporate_admin,
        is_first_session: 1,
        password: hash,
        corporate_id: insertId ? insertId : null,
        woloo_id: woloo_id ? woloo_id : null
    });

    return newuser.insertId;
};

const updateUser = async (user_id:any,email: any, mobile: any, contact_name: any, password: any, insertId: any, woloo_id: any) => {
    
    // const setting = await new WolooGuestModel().getSettings("site.free_trial_period_days");
    // let exp_date = new Date(Date.now());
    // exp_date.setDate(exp_date.getDate() + Number(setting[0].value));

    // const referalCode = common.genRefCode();
    let hash = await new Hashing().generateHash(password, 12);
    let newuser = await new WolooGuestModel().updateWolooGuest({
        email: email,
        mobile: mobile,
        name: contact_name,
        // expiry_date: new Date(exp_date).toISOString().split('T')[0],
        // ref_code: referalCode,
        role_id: woloo_id ? constants.rbac?.role_id?.host_id :"" ,
        is_first_session: 1,
        password: hash,
        corporate_id: insertId ? insertId : null,
        woloo_id: woloo_id ? woloo_id : null
    },user_id);

    return newuser;
};

// const algorithm = 'aes-256-cbc';
// const secretKey = process.env.ENC_KEY || '12345678901234567890123456789012'; // Must be 32 chars
// const iv = crypto.randomBytes(16);

// function encrypt(text:any) {
//   const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
//   let encrypted = cipher.update(text);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return iv.toString('hex') + ':' + encrypted.toString('hex');
// }

// function decrypt(encryptedText:any) {
//   const textParts = encryptedText.split(':');
//   const iv = Buffer.from(textParts.shift(), 'hex');
//   const encrypted = Buffer.from(textParts.join(':'), 'hex');
//   const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
//   let decrypted = decipher.update(encrypted);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   return decrypted.toString();
// }

export default {
    createGuest,
    createUser,
    updateUser
}