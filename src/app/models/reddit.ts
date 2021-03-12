/*
  OAuth parameters for reddit

  Per: https://github.com/reddit-archive/reddit/wiki/oauth2#authorization
  "client_id": oauth client id
  "response_type": "code"
  "state": generated state string
  "redirect_uri": extension's redirect URI
  "duration": "permanent"
  "scope": list of oauth scopes we want
*/

export class OAuthParams {
    static authURL: string = "https://www.reddit.com/api/v1/authorize";
    static tokenURL: string = "https://www.reddit.com/api/v1/access_token";
    static scopes: Array<string> = ["identity", "history", "read"];
    static responseType: string = "code";
    static duration: string = "permanent";
}

export interface OAuthCodeRequest {
    grant_type: string,
    code: string,
    redirect_uri: string,
}

// Used for both code and refresh token responses
export interface OAuthCodeResponse {
    access_token: string,
    token_type: string,
    expires_in: number,
    scope: string,
    refresh_token: string,
}

export interface OAuthRefreshRequest {
    grant_type: string,
    refresh_token: string,
}

/*
  Sample URLs:
    /user/myname/comments
    /user/myname/submitted
    /user/myname/about
    /user/myname/overview
    /r/friends/new
    /r/friends/comments
*/
export class RedditParams {
    static baseURL: string = "https://oauth.reddit.com";
    static userBase: string = "/user/";
    static friendsBase: string = "/r/friends";
    static submitted: string = "/submitted";
    static comments: string = "/comments";
    static about: string = "/about";
    static overview: string = "/overview";
    static userAgent: string = "web:usernotify:0.1";
}

export interface AboutResponse {
    kind: string,
    data: AboutData
}

export interface AboutData {
    id: string,
    name: string,
}

export interface ListingReponse {
    kind: string,
    data: ListingData,
}

export interface ListingData {
    modhash: string,
    dist: number,
    children: Array<ListingItem>,
    after: string | null,
    before: string | null,
}

export interface ListingItem {
    kind: string,
    data: ListingItemData,
}

export interface ListingItemData {
    id: string,
    author: string,
    body: string,
    link_title: string,
    permalink: string,
    subreddit: string,
}