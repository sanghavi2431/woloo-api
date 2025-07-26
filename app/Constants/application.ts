const base = '/api';

export default {
    url: {
        base,
    },
    timers: {

    },
    env: {
        "APP_PACKAGE_NAME":"in.woloo.www",
        "APP_PACKAGE_NAME_IOS":"in.woloo.app"
    },
    authorizationIgnorePath: [
        `${base}/wolooGuest/sendOTP`,
        `${base}/wolooGuest/sendOTPForHost`,
        `${base}/wolooGuest/sendOTPForClient`,
        `${base}/wolooGuest/verifyOTPForHost`,
        `${base}/wolooGuest/verifyOTP`,
        `${base}/wolooGuest/verifyOTPForClient`,
        `${base}/wolooGuest/login`,
        `${base}/wolooGuest/appConfig`,
        `${base}/healthCheck`,
        `${base}/voucher/webhook`,
        `${base}/wolooHost/addCoinsWebhook`,
        `${base}/privacy-policy`,
        `${base}/client/auth`,
        `${base}/client/register`,
        `${base}/wolooGuest/byId`,
        `${base}/wolooGuest/createClient`,
        `${base}/wolooGuest/forgetPassword`,
        `${base}/wolooGuest/resetPassword`,
       // `${base}/wolooGuest/wahcertificate`
    ],
};
