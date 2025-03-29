export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const routes = JSON.parse(env.WRK_ROUTES); // 解析路由配置
  
      // 遍历路由规则，匹配路径前缀
      for (const [pathPrefix, targetBase] of Object.entries(routes)) {
        if (url.pathname.startsWith(pathPrefix)) {
          const targetUrl = new URL(targetBase);
          
          // 重写路径：移除前缀
          const newPath = url.pathname.replace(new RegExp(`^${pathPrefix}`), '');
          targetUrl.pathname = newPath || '/'; // 处理根路径
  
          // 克隆并转发请求
          const newRequest = new Request(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'follow'
          });
  
          // 添加代理头信息（可选）
          newRequest.headers.set('X-Forwarded-Host', url.host);
  
          try {
            const response = await fetch(newRequest);
            return this.applyCors(response); // 处理跨域
          } catch (err) {
            return new Response('Backend Error', { status: 502 });
          }
        }
      }
  
      // 未匹配任何路由时返回 404
      return new Response('Not Found', { status: 404 });
    },
  
    // 统一处理跨域
    applyCors(response) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };
      return new Response(response.body, {
        status: response.status,
        headers: { ...response.headers, ...corsHeaders }
      });
    }
  };