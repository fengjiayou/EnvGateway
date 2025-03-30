addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const CONFIG_URL = ""; // 远程 JSON 配置（如果为空，则使用本地）

const defaultRouteConfig = {
  "/gh/": "https://cdn.jsdelivr.net",
  "/blog/": "https://blog.fengmayou.top",
  "/gh/": "https://cdn.jsdelivr.net",
  "/example/": "https://www.example.com"

};

async function handleRequest(request) {
  let routeConfig = defaultRouteConfig;

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
  for (const [pathPrefix, target] of Object.entries(routeConfig)) {
    if (url.pathname.startsWith(pathPrefix)) {
      targetBase = target;
      url.pathname = url.pathname.replace(pathPrefix, "");
      break;
    }
  }

  if (!targetBase) {
    return new Response("404 Not Found\nNo matching route found", { status: 404 });
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

  // **🔧 强制桌面版**
  modifiedRequest.headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  modifiedRequest.headers.set(
    "Accept",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
  );
  modifiedRequest.headers.set("CF-Connecting-IP", "8.8.8.8");

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
    return modifiedResponse;
  } catch (error) {
    return new Response(`🚨 Proxy Error: ${error.message}`, { status: 500 });
  }
}
