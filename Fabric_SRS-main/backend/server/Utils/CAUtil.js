'use strict';

const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';

/**
 * Build the Fabric CA client
 */
exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
    const caInfo = ccp.certificateAuthorities[caHostName];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(
        caInfo.url,
        { trustedRoots: caTLSCACerts, verify: false },
        caInfo.caName
    );
    console.log(`✅ Built a CA Client named ${caInfo.caName}`);
    return caClient;
};

/**
 * Enroll the admin user (if not yet in wallet)
 */
exports.enrollAdmin = async (caClient, wallet, username, password, orgMspId) => {
    try {
        const identity = await wallet.get(username);
        if (identity) {
            console.log('⚠️ Admin identity already exists in the wallet');
            return;
        }

        const enrollment = await caClient.enroll({
            enrollmentID: username,
            enrollmentSecret: password
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        await wallet.put(username, x509Identity);
        console.log('✅ Successfully enrolled admin user and imported into the wallet');
        return true;
    } catch (error) {
        console.error(`❌ Failed to enroll admin user: ${error}`);
        return false;
    }
};

/**
 * Register and enroll a user with "type" attribute (student, lecturer, etc.)
 */
exports.registerAndEnrollUser = async (
    caClient,
    wallet,
    orgMspId,
    userId,
    affiliation,
    userType
) => {
    try {
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log(`⚠️ Identity for user ${userId} already exists in the wallet`);
            return;
        }

        // Get admin identity
        const adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            throw new Error('Admin identity not found in wallet. Enroll admin first.');
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

        // ✅ Register user (no hardcoded secret)
        const secret = await caClient.register({
            affiliation,
            enrollmentID: userId,
            role: 'client',
            attrs: [
                {
                    name: 'type',    // 👈 matches your chaincode’s getUserAttrs() field
                    value: userType, // e.g., "lecturer", "student"
                    ecert: true
                }
            ]
        }, adminUser);

        // ✅ Enroll user
        const enrollment = await caClient.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret,
            attr_reqs: [{ name: 'type', optional: false }]
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };

        await wallet.put(userId, x509Identity);
        console.log(`✅ Successfully registered & enrolled user ${userId} (${userType})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to register user ${userId}: ${error}`);
        return false;
    }
};
