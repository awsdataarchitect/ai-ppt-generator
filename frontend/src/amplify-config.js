import { Amplify } from 'aws-amplify';
import config from './config.js';

const amplifyConfig = {
    Auth: {
        Cognito: {
            userPoolId: config.userPoolId,
            userPoolClientId: config.userPoolClientId,
            loginWith: {
                email: true,
                username: false
            },
            signUpVerificationMethod: 'code',
            userAttributes: {
                email: { required: true }
            },
            allowGuestAccess: true
        }
    }
};

Amplify.configure(amplifyConfig);
export default amplifyConfig;
