// Secure configuration module - no hardcoded fallbacks
class Config {
    constructor() {
        this.validateEnvironment();
    }

    validateEnvironment() {
        const requiredEnvVars = [
            'NEXT_PUBLIC_USER_POOL_ID',
            'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
            'NEXT_PUBLIC_GRAPHQL_ENDPOINT',
            'NEXT_PUBLIC_AWS_REGION'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
    }

    get userPoolId() {
        return process.env.NEXT_PUBLIC_USER_POOL_ID;
    }

    get userPoolClientId() {
        return process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
    }

    get graphqlEndpoint() {
        return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    }

    get awsRegion() {
        return process.env.NEXT_PUBLIC_AWS_REGION;
    }

    get assetsBucket() {
        return process.env.NEXT_PUBLIC_ASSETS_BUCKET;
    }
}

// Export singleton instance
export default new Config();
