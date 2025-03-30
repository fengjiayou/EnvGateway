addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const CONFIG_URL = ""; // 设置远程 JSON 配置地址（如果为空，则使用本地默认配置）

const defaultRouteConfig = {
  "/gh/": "https://cdn.jsdelivr.net",
  "/baidu/": "https://www.baidu.com",
  "/example/": "https://www.example.com"
};

// 处理特殊请求头的规则
const specialCases = {
  "*": {
    "Origin": "DELETE",
    "Referer": "DELETE"
  }
};

// 处理请求头，根据规则删除或修改
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
}

async function handleRequest(request) {
  let routeConfig = defaultRouteConfig;

  // **尝试从远程 JSON 读取配置**
  if (CONFIG_URL) {
    try {
      const response = await fetch(CONFIG_URL);
      if (response.ok) {
        routeConfig = await response.json();
        console.log("✅ 成功加载在线配置");
      } else {
        console.warn("⚠️ 远程配置加载失败，使用本地默认配置");
      }
    } catch (error) {
      console.error("❌ 远程配置无法加载，使用本地默认配置:", error);
    }
  }

  const url = new URL(request.url);
  if (url.pathname === "/") {
    return new Response("Please enter the link after the /", { status: 400 });
  }

  let targetBase = null;

  // **匹配代理规则**
  for (const [pathPrefix, target] of Object.entries(routeConfig)) {
    if (url.pathname.startsWith(pathPrefix)) {
      targetBase = target;
      url.pathname = url.pathname.replace(pathPrefix, ""); // 移除匹配前缀
      break;
    }
  }

  // **没有匹配的代理路径**
  if (!targetBase) {
    return new Response("404 Not Found\nNo matching route found", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // **构造目标 URL**
  const targetUrl = new URL(targetBase);
  targetUrl.pathname += url.pathname; // 保持路径
  targetUrl.search = url.search; // 保留查询参数

  console.log(`🔀 代理到: ${targetUrl.toString()}`);

  // **创建新的请求**
  const modifiedRequest = new Request(targetUrl, {
    headers: new Headers(request.headers), // 复制原始请求头
    method: request.method,
    body: request.body,
    redirect: "follow"
  });

  handleSpecialCases(modifiedRequest); // 处理特殊请求头

  try {
    const response = await fetch(modifiedRequest);

    // **处理 CORS 头部**
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
    return modifiedResponse;
  } catch (error) {
    return new Response(`🚨 Proxy Error: ${error.message}`, { status: 500 });
  }
}
