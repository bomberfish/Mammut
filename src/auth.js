// var domain = localStorage.getItem("instanceDomain");
let redirectUri = window.location.origin + "/auth_redirect.html";

function auth() {
  console.log("authenticate");
  window.location.href =
    localStorage.getItem("instanceDomain") +
    "/oauth/authorize?response_type=code&client_id=" +
    encodeURIComponent(localStorage.getItem("client_id")) +
    "&redirect_uri=" +
    encodeURIComponent(redirectUri) +
    "&scope=" +
    encodeURIComponent(
      "read write follow profile push admin:read admin:write",
    ) +
    "&force_login=true";
}

function getToken() {
  console.log("getToken");
  var requestBody = JSON.stringify({
    grant_type: "authorization_code",
    code: localStorage.getItem("auth_code"),
    client_id: localStorage.getItem("client_id"),
    client_secret: localStorage.getItem("client_secret"),
    redirect_uri: redirectUri,
  });
  var callback = function (xhr) {
    if (xhr.status == 200) {
      var response = JSON.parse(xhr.responseText);
      localStorage.setItem("access_token", response.access_token);
      console.log("we ball");
      if (isMobile()) {
        window.location.href = "/timelines/following.html";
      } else {
        window.location.href = "/deck.html";
      }
    } else {
      window.location.href =
        "/error.html?error=" +
        truncate(
          encodeURIComponent(
            "Endpoint /oauth/token returned code " +
              xhr.status +
              " and readyState " +
              xhr.readyState +
              "\n" +
              xhr.responseText,
          ),
          2000,
        );
    }
  };
  grab(
    "/oauth/token",
    "POST",
    true,
    callback,
    requestBody,
    "application/json; charset=utf-8",
  );
}

function logOut() {
  console.log("logOut");
  var endpoint = "/oauth/revoke";
  var method = "POST";
  var async = true;
  var requestBody = JSON.stringify({
    client_id: localStorage.getItem("client_id"),
    client_secret: localStorage.getItem("client_secret"),
    token: localStorage.getItem("access_token"),
  });
  var callback = function (xhr) {
    if (xhr.status == 200) {
      localStorage.clear();
      window.top.location.href = "/domain.html";
    } else {
      window.location.href =
        "/error.html?error=" +
        truncate(
          encodeURIComponent(
            "Endpoint /oauth/revoke returned code " +
              xhr.status +
              " and readyState " +
              xhr.readyState +
              "\n" +
              xhr.responseText,
          ),
          2000,
        );
    }
  };
  grab(
    endpoint,
    method,
    async,
    callback,
    requestBody,
    "application/json; charset=utf-8",
  );
}

function createApp() {
  console.log("createApp");
  if (localStorage.getItem("instanceDomain") == null) {
    localStorage.setItem(
      "instanceDomain",
      document.getElementById("domain").value,
    );
  }
  console.log(localStorage.getItem("domain"));
  var requestBody = JSON.stringify({
    client_name: "Mammut",
    redirect_uris: redirectUri,
    scopes: "read write follow profile push admin:read admin:write",
    website: window.location.origin,
  });
  var callback = function (xhr) {
    if (xhr.status == 200) {
      var response = JSON.parse(xhr.responseText);
      localStorage.setItem("client_id", response.client_id);
      localStorage.setItem("client_secret", response.client_secret);
      window.location.href = "auth.html";
    } else if (xhr.status != 200) {
      // window.location.href =
      //   "/error.html?error=" +
      //   truncate(
      //     encodeURIComponent(
      //       "Endpoint /api/v1/apps returned code " +
      //         xhr.status +
      //         " and readyState " +
      //         xhr.readyState +
      //         "\n" +
      //         xhr.responseText,
      //     ),
      //     2000,
      //   );
    }
  };
  grab(
    "/api/v1/apps",
    "POST",
    true,
    callback,
    requestBody,
    "application/json; charset=utf-8",
  );
}

if (localStorage.getItem("access_token") == null) {
  console.log("access_token is null btw");
}

if (
  localStorage.getItem("instanceDomain") == null ||
  localStorage.getItem("client_id") == null ||
  localStorage.getItem("client_secret") == null ||
  localStorage.getItem("auth_code") == null ||
  localStorage.getItem("access_token") == null
) {
  if (
    window.location.pathname != "/domain.html" &&
    window.location.pathname != "/auth.html"
  ) {
    window.top.location.href = "/domain.html";
  }
} else if (
  window.location.pathname != "/user.html" &&
  window.location.pathname != "/deck-nav.html"
) {
  console.log(window.location.pathname);
  if (isMobile()) {
    window.location.href = "/timelines/following.html";
  } else {
    window.location.href = "/deck.html";
  }
}
