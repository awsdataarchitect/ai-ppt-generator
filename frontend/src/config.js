// Environment-based configuration with proper fallbacks
class Config {
    constructor() {
        // Use environment variables with validation
        this._userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
        this._userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
        this._graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
        this._awsRegion = process.env.NEXT_PUBLIC_AWS_REGION;
        this._assetsBucket = process.env.NEXT_PUBLIC_ASSETS_BUCKET;
        
        console.log('Config initialized with environment variables');
        console.log('Environment check:', {
            userPoolId: this._userPoolId ? 'SET' : 'MISSING',
            userPoolClientId: this._userPoolClientId ? 'SET' : 'MISSING',
            graphqlEndpoint: this._graphqlEndpoint ? 'SET' : 'MISSING',
            awsRegion: this._awsRegion ? 'SET' : 'MISSING',
            assetsBucket: this._assetsBucket ? 'SET' : 'MISSING'
        });
        
        this.validateEnvironment();
    }

    validateEnvironment() {
        const missing = [];
        
        if (!this._userPoolId) missing.push('NEXT_PUBLIC_USER_POOL_ID');
        if (!this._userPoolClientId) missing.push('NEXT_PUBLIC_USER_POOL_CLIENT_ID');
        if (!this._graphqlEndpoint) missing.push('NEXT_PUBLIC_GRAPHQL_ENDPOINT');
        if (!this._awsRegion) missing.push('NEXT_PUBLIC_AWS_REGION');
        if (!this._assetsBucket) missing.push('NEXT_PUBLIC_ASSETS_BUCKET');
        
        if (missing.length > 0) {
            const error = `Missing required environment variables: ${missing.join(', ')}`;
            console.error(error);
            throw new Error(error);
        }
        
        return true;
    }

    get userPoolId() {
        return this._userPoolId;
    }

    get userPoolClientId() {
        return this._userPoolClientId;
    }

    get graphqlEndpoint() {
        return this._graphqlEndpoint;
    }

    get awsRegion() {
        return this._awsRegion;
    }

    get assetsBucket() {
        return this._assetsBucket;
    }
}

// Export singleton instance
export default new Config();
