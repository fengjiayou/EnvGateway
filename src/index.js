addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // 配置多个目标主机名，根据路径选择目标
  const routeConfig = {
    "/gh/": "cdn.jsdelivr.net",  // /gh/ 路径代理到 cdn.jsdelivr.net
    "/baidu/": "www.baidu.com",  // /baidu/ 路径代理到 www.baidu.com
    "/example/": "www.example.com"  // /example/ 路径代理到 www.example.com
  };

  let targetHostname = null;

  // 根据路径匹配选择目标主机名
  for (const [pathPrefix, target] of Object.entries(routeConfig)) {
    if (url.pathname.startsWith(pathPrefix)) {
      targetHostname = target;
      break;
    }
  }

  if (targetHostname) {
    // 如果匹配到目标，修改请求的主机名
    url.hostname = targetHostname;
  } else {
    // 默认目标，如果没有匹配到路径
    url.hostname = "blog.fengmayou.top";  // 设置一个默认的目标主机名
  }

  // 创建新的请求，保留原始请求的头部和方法
  const request = new Request(url, event.request);

  // 响应请求，发起转发请求
  event.respondWith(
    fetch(request)
      .then(response => {
        // 处理 CORS，确保响应允许跨域访问
        return new Response(response.body, {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      })
      .catch(err => {
        // 错误处理，返回 500 错误
        return new Response('Error occurred while fetching the request', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
