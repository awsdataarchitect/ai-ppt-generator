import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

class AuthService {
    async signIn(email, password) {
        try {
            const result = await signIn({
                username: email,
                password: password
            });
            console.log('Sign in successful:', result);
            return { success: true, result };
        } catch (error) {
            if (error.name === 'UserAlreadyAuthenticatedException') {
                console.log('User already authenticated, checking if it\'s the same user...');
                try {
                    const user = await getCurrentUser();
                    // Check if the current user matches the email trying to sign in
                    if (user.username === email || user.signInDetails?.loginId === email) {
                        // Same user is already authenticated - this is valid
                        return { success: true, result: { user }, alreadyAuthenticated: true };
                    } else {
                        // Different user trying to sign in, sign out first and retry
                        console.log('Different user detected, signing out current user...');
                        await signOut();
                        // Retry sign in with the new credentials (this will validate the password)
                        return await this.signIn(email, password);
                    }
                } catch (getCurrentError) {
                    console.error('Error getting current user:', getCurrentError);
                    // If we can't get current user, sign out and retry to ensure proper authentication
                    try {
                        await signOut();
                        return await this.signIn(email, password);
                    } catch (signOutError) {
                        return { success: false, error: 'Authentication error. Please refresh and try again.' };
                    }
                }
            }
            
            // Handle other authentication errors
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password) {
        try {
            const result = await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email: email
                    }
                }
            });
            console.log('Sign up successful:', result);
            return { success: true, result };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async confirmSignUp(email, code) {
        try {
            const result = await confirmSignUp({
                username: email,
                confirmationCode: code
            });
            console.log('Confirmation successful:', result);
            return { success: true, result };
        } catch (error) {
            console.error('Confirmation error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await signOut();
            console.log('Sign out successful');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentAuthState() {
        try {
            const user = await getCurrentUser();
            const session = await fetchAuthSession();
            
            return {
                isAuthenticated: true,
                user: {
                    username: user.username,
                    email: user.signInDetails?.loginId || user.username
                },
                session: session
            };
        } catch (error) {
            console.log('No authenticated user found:', error.message);
            return {
                isAuthenticated: false,
                user: null,
                session: null
            };
        }
    }
}

export { AuthService };
