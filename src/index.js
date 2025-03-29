export default {
  async fetch(request, env) {
    try {
      // ==================== 初始化 & 日志记录 ====================
      const url = new URL(request.url);
      console.log(`[Request] ${request.method} ${url.pathname}`);

      // ==================== 处理静态资源请求 ====================
      if (url.pathname === '/favicon.ico') {
        return new Response(null, { 
          status: 204,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        });
      }

      // ==================== 环境变量验证 ====================
      if (!env.WRK_ROUTES) {
        throw new Error('WRK_ROUTES environment variable is undefined');
      }

      // ==================== 解析路由配置 ====================
      let routes;
      try {
        routes = JSON.parse(env.WRK_ROUTES);
        console.log('[Config] Parsed routes:', routes);
      } catch (e) {
        throw new Error(`Invalid WRK_ROUTES JSON: ${e.message}`);
      }

      // ==================== 动态路由匹配 ====================
      for (const [pathPrefix, targetBase] of Object.entries(routes)) {
        // 使用 encodeURIComponent 确保路径前缀的安全性
        const safePathPrefix = encodeURIComponent(pathPrefix);

        if (url.pathname.startsWith(safePathPrefix)) {
          console.log(`[Routing] Matched prefix: ${pathPrefix} -> ${targetBase}`);

          // ==================== 构建目标URL ====================
          const targetUrl = new URL(targetBase);
          
          // 路径重写：移除前缀并保留后续路径
          const newPath = url.pathname.replace(new RegExp(`^${safePathPrefix}`), '') || '/';
          targetUrl.pathname = newPath;
          
          // 保留原始查询参数
          targetUrl.search = url.search;

          // ==================== 克隆并转发请求 ====================
          const newRequest = new Request(targetUrl, {
            method: request.method,
            headers: new Headers(request.headers),
            body: request.body,
            redirect: 'follow'
          });

          // 添加代理头信息
          newRequest.headers.set('X-Forwarded-Host', url.host);
          newRequest.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

          // ==================== 请求后端服务 ====================
          try {
            const response = await fetch(newRequest);
            console.log(`[Proxy] ${targetUrl} -> ${response.status}`);

            // 处理跨域 (CORS)
            const corsHeaders = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            };

            return new Response(response.body, {
              status: response.status,
              headers: { ...Object.fromEntries(response.headers), ...corsHeaders }
            });

          } catch (e) {
            throw new Error(`Backend request failed: ${e.message}`);
          }
        }
      }

      // ==================== 未匹配路由 ====================
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      // ==================== 全局错误处理 ====================
      console.error(`[Error] ${error.stack}`);

      return new Response(
        `🚨 Proxy Error: ${error.message}\n\n` + 
        `📌 Request URL: ${request.url}\n` +
        `🔧 Worker Version: ${env.WORKER_VERSION || 'unknown'}\n` +
        `📅 Timestamp: ${new Date().toISOString()}\n` +
        `🛠️ Error Trace: ${error.stack}`,
        {
          status: 500,
          headers: { 
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  }
}
