// 本地自部署模式：跳过 Logto 登录，始终视为已登录的本地用户
export const LOCAL_USER_ID = "local-user";

const localUserInfo = {
  sub: LOCAL_USER_ID,
  picture: "",
  username: "我",
  email: "local@localhost",
};

export async function setupAuth() {}

export async function signIn(_callback?: string) {
  // 本地模式无需登录
}

export function signOut() {
  // 本地模式无需登出
}

export function isAuthenticated() {
  return true;
}

export async function getToken() {
  return "local-token";
}

export async function fetchUserInfo() {
  return localUserInfo;
}

export function getSignInCallback() {
  let callback = sessionStorage.getItem("callback");
  if (callback) {
    sessionStorage.removeItem("callback");
    return callback;
  } else {
    return "/";
  }
}

export function setSignInCallback(callback: string) {
  sessionStorage.setItem("callback", callback);
}
