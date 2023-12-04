import { type UserIdResolvable } from '@twurple/common';
import { AccessToken, AccessTokenMaybeWithUserId, AccessTokenWithUserId, AuthProvider } from '@twurple/auth';


export class MockAuthProvider implements AuthProvider {
    private readonly _clientId: string;
    private readonly _accessToken: AccessToken;
    private _userId: string;
    private _scopes?: string[];

    constructor(clientId: string, accessToken: string | AccessToken, userId: string, scopes?: string[]) {
        this._clientId = clientId || '';
        this._accessToken =
            typeof accessToken === 'string'
                ? {
                    accessToken,
                    refreshToken: null,
                    scope: scopes ?? [],
                    expiresIn: null,
                    obtainmentTimestamp: Date.now(),

                }
                : accessToken;
        this._scopes = scopes;
        this._userId = userId;
    }

    get clientId(): string {
        return this._clientId;
    }

    async getAccessTokenForUser(
        user: UserIdResolvable,
        ...scopeSets: Array<string[] | undefined>
    ): Promise<AccessTokenWithUserId> {
        return { ...this._accessToken, userId: this._userId };
    }

    async getAccessTokenForIntent(
        intent: string,
        ...scopeSets: Array<string[] | undefined>
    ): Promise<AccessTokenWithUserId> {
        return { ...this._accessToken, userId: this._userId };
    }

    async getAnyAccessToken(): Promise<AccessTokenMaybeWithUserId> {
        return { ...this._accessToken, userId: this._userId };
    }

    getCurrentScopesForUser(): string[] {
        return this._scopes ?? [];
    }

}