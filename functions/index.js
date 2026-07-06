const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

admin.initializeApp();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
const MAX_OTP_ATTEMPTS = 5;

const mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // STARTTLS on port 587
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// Sends a 6-digit OTP to the user's email so they can reset their password
// without needing Firebase's fixed reset-link flow.
exports.requestPasswordResetOtp = onCall(async (request) => {
    const email = ((request.data && request.data.email) || '').trim().toLowerCase();
    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required.');
    }

    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
    } catch (e) {
        throw new HttpsError('not-found', 'No account found with this email.');
    }

    const otpRef = admin.firestore().doc(`passwordResetOtps/${email}`);
    const existing = await otpRef.get();
    if (existing.exists) {
        const createdAtMs = existing.data().createdAt?.toMillis ? existing.data().createdAt.toMillis() : 0;
        if (Date.now() - createdAtMs < OTP_RESEND_COOLDOWN_MS) {
            throw new HttpsError('resource-exhausted', 'Please wait a minute before requesting another code.');
        }
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await otpRef.set({
        otpHash: hashOtp(otp),
        uid: userRecord.uid,
        attempts: 0,
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + OTP_TTL_MS),
    });

    await mailTransporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'Hey Church'}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Your password reset code',
        text: `Your Hey Church password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
        html: `<p>Your Hey Church password reset code is:</p><h2 style="letter-spacing:4px;">${otp}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    });

    return { success: true };
});

// Verifies the OTP sent by requestPasswordResetOtp and, if valid, sets the
// user's new password directly via the Admin SDK.
exports.confirmPasswordResetOtp = onCall(async (request) => {
    const email = ((request.data && request.data.email) || '').trim().toLowerCase();
    const otp = ((request.data && request.data.otp) || '').trim();
    const newPassword = (request.data && request.data.newPassword) || '';

    if (!email || !otp || !newPassword) {
        throw new HttpsError('invalid-argument', 'Email, code, and new password are required.');
    }
    if (newPassword.length < 6) {
        throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
    }

    const otpRef = admin.firestore().doc(`passwordResetOtps/${email}`);
    const snap = await otpRef.get();
    if (!snap.exists) {
        throw new HttpsError('failed-precondition', 'No reset code found. Please request a new one.');
    }

    const data = snap.data();
    const expiresAtMs = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : 0;
    if (Date.now() > expiresAtMs) {
        await otpRef.delete();
        throw new HttpsError('deadline-exceeded', 'This code has expired. Please request a new one.');
    }

    if ((data.attempts || 0) >= MAX_OTP_ATTEMPTS) {
        await otpRef.delete();
        throw new HttpsError('resource-exhausted', 'Too many incorrect attempts. Please request a new code.');
    }

    if (hashOtp(otp) !== data.otpHash) {
        await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
        throw new HttpsError('invalid-argument', 'Incorrect code. Please try again.');
    }

    await admin.auth().updateUser(data.uid, { password: newPassword });
    await otpRef.delete();

    return { success: true };
});

// FCM allows a maximum of 500 tokens per multicast request.
const TOKEN_CHUNK_SIZE = 500;

// Callable from the admin dashboard. Fans a push notification out to every
// device token belonging to users who have opted in (pushNotificationsEnabled === true).
exports.sendPushToOptedInUsers = onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const callerSnap = await admin.firestore().doc(`users/${auth.uid}`).get();
    if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can send broadcast push notifications.');
    }

    const title = (data && data.title || '').trim();
    const body = (data && data.body || '').trim();
    const link = (data && data.link || '').trim();
    if (!title || !body) {
        throw new HttpsError('invalid-argument', 'A title and body are required.');
    }

    const usersSnap = await admin.firestore()
        .collection('users')
        .where('pushNotificationsEnabled', '==', true)
        .get();

    // Map each token to the user doc(s) holding it, so stale tokens can be cleaned up.
    const tokenToUserRefs = new Map();
    usersSnap.forEach((docSnap) => {
        const tokens = docSnap.data().fcmTokens || [];
        tokens.forEach((token) => {
            if (!tokenToUserRefs.has(token)) tokenToUserRefs.set(token, []);
            tokenToUserRefs.get(token).push(docSnap.ref);
        });
    });

    const allTokens = Array.from(tokenToUserRefs.keys());
    if (allTokens.length === 0) {
        return { recipientCount: 0, successCount: 0, failureCount: 0 };
    }

    const message = {
        notification: { title, body },
        data: link ? { link } : {},
    };

    let successCount = 0;
    let failureCount = 0;
    const staleTokens = [];

    for (let i = 0; i < allTokens.length; i += TOKEN_CHUNK_SIZE) {
        const chunk = allTokens.slice(i, i + TOKEN_CHUNK_SIZE);
        const response = await admin.messaging().sendEachForMulticast({ tokens: chunk, ...message });
        successCount += response.successCount;
        failureCount += response.failureCount;
        response.responses.forEach((res, idx) => {
            if (!res.success) {
                const code = res.error && res.error.code;
                if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                    staleTokens.push(chunk[idx]);
                }
            }
        });
    }

    if (staleTokens.length > 0) {
        const batch = admin.firestore().batch();
        staleTokens.forEach((token) => {
            const refs = tokenToUserRefs.get(token) || [];
            refs.forEach((ref) => batch.update(ref, { fcmTokens: admin.firestore.FieldValue.arrayRemove(token) }));
        });
        await batch.commit();
    }

    return { recipientCount: allTokens.length, successCount, failureCount };
});
