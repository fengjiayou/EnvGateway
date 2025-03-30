addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, env) {
  const configUrl = env.CONFIG_URL || ""; // 读取环境变量，如果没有则留空

  // **本地默认的路由配置**
  let routeConfig = {
    "/blog/": "blog.fengmayou.top",
    "/koodo-reader/": "koodo-reader-sever.19820805.xyz",
    "/example/": "www.example.com"
  };

  try {
    if (configUrl) {
      // **尝试从远程 URL 加载 JSON 配置**
      const response = await fetch(configUrl, { method: "GET" });
      if (response.ok) {
        routeConfig = await response.json(); // 解析 JSON 配置
        console.log("✅ 成功加载在线配置");
      } else {
        console.warn("⚠️ 远程配置加载失败，使用本地默认配置");
      }
    }
  } catch (error) {
    console.error("❌ 远程配置无法加载，使用本地默认配置:", error);
  }

  const url = new URL(request.url);
  let targetHostname = null;

  // **匹配代理规则**
  for (const [pathPrefix, target] of Object.entries(routeConfig)) {
    if (url.pathname.startsWith(pathPrefix)) {
      targetHostname = target;
      break;
    }
  }

  // **没有匹配到规则，返回 404**
  if (!targetHostname) {
    return new Response("No matching route found", { status: 404 });
  }

  // **修改目标主机**
  url.hostname = targetHostname;

  // **创建新请求**
  const modifiedRequest = new Request(url, request);

  // **转发请求**
  return fetch(modifiedRequest);
}
