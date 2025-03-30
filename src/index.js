addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const CONFIG_URL = ""; // 远程 JSON 配置（如果为空，则使用本地）

const defaultRouteConfig = {
  "/gh/": "https://cdn.jsdelivr.net",
  "/baidu/": "https://www.baidu.com",
  "/example/": "https://www.example.com"
};

const specialCases = {
  "*": {
    "Origin": "DELETE",
    "Referer": "DELETE"
  }
};

async function handleRequest(request) {
  let routeConfig = defaultRouteConfig;

  // 🔹 如果提供了远程 JSON，则加载远程配置
  if (CONFIG_URL) {
    try {
      const response = await fetch(CONFIG_URL);
      if (response.ok) {
        routeConfig = await response.json();
      }
    } catch (error) {
      console.warn("⚠️ 无法加载远程配置，使用本地默认配置");
    }
  }

  const url = new URL(request.url);
  if (url.pathname === "/") {
    return new Response("Please enter the link after the /", { status: 400 });
  }

  let targetBase = null;
  let isDirectURL = false;

  // 🔹 检测是否匹配路径代理
  for (const [pathPrefix, target] of Object.entries(routeConfig)) {
    if (url.pathname.startsWith(pathPrefix)) {
      targetBase = target;
      url.pathname = url.pathname.replace(pathPrefix, "");
      break;
    }
  }

  // 🔹 如果没有匹配路径代理，尝试直接代理 URL
  if (!targetBase) {
    try {
      const actualUrl = new URL(url.pathname.replace("/", "") + url.search);
      targetBase = actualUrl.origin;
      url.pathname = actualUrl.pathname;
      url.search = actualUrl.search;
      isDirectURL = true;
    } catch (e) {
      return new Response("404 Not Found\nNo matching route found", { status: 404 });
    }
  }

  const targetUrl = new URL(targetBase);
  targetUrl.pathname += url.pathname;
  targetUrl.search = url.search;

  const modifiedRequest = new Request(targetUrl, {
    headers: new Headers(request.headers),
    method: request.method,
    body: request.body,
    redirect: "follow"
  });

  // 🔹 处理特殊 Headers 规则
  handleSpecialCases(modifiedRequest);

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");

    return modifiedResponse;
  } catch (error) {
    return new Response(`🚨 Proxy Error: ${error.message}`, { status: 500 });
  }
}

function handleSpecialCases(request) {
  const url = new URL(request.url);
  const rules = specialCases[url.hostname] || specialCases["*"];
  for (const [key, value] of Object.entries(rules)) {
    switch (value) {
      case "KEEP":
        break;
      case "DELETE":
        request.headers.delete(key);
        break;
      default:
        request.headers.set(key, value);
        break;
    }
  }

  // 🔹 强制使用桌面版 User-Agent，防止返回手机版
  request.headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  request.headers.set(
    "Accept",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
  );
  request.headers.set("CF-Connecting-IP", "8.8.8.8");
}
