
# 🌐 多功能代理服务 EnvGateway

## 📌 项目简介
本项目是一个 **基于 Cloudflare Workers 的 HTTP 代理**，支持 **路径代理** 和 **URL 代理**，并提供 **远程 JSON 配置** 选项。

### ✨ 功能特点
✅ **路径代理**（如 `/gh/` → `cdn.jsdelivr.net`）  
✅ **URL 代理**（直接输入 URL 进行代理）  
✅ **远程 JSON 配置**（动态加载代理规则）  
✅ **防止 Cloudflare 误判为手机版**（强制桌面版）  
✅ **支持 CORS**（允许跨域请求）  
✅ **删除 `Referer` 和 `Origin` 头**（避免防盗链限制）  

## 🚀 部署方法

### 1️⃣ 部署到 Cloudflare Workers
1. [Fork 仓库](https://github.com/fengjiayou/EnvGateway)到你自己的 GitHub 账户
2. 登录 [Cloudflare](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages**，创建一个新的 Worker
4. 选择你 Fork 过来的仓库
5. 保存并部署，即可开始使用代理服务

## 🔧 配置方法

### 1️⃣ 路径代理
你可以修改 `defaultRouteConfig` 变量，来定义不同路径的代理目标。例如：

```javascript
const defaultRouteConfig = {
  "/gh/": "cdn.jsdelivr.net",
  "/baidu/": "www.baidu.com",
  "/example/": "www.example.com"
};
```

- 访问 `/gh/somefile.js` 时，会代理到 `https://cdn.jsdelivr.net/somefile.js`
- 访问 `/baidu/` 时，会代理到 `https://www.baidu.com/`

### 2️⃣ URL 代理
如果你访问 `/https://example.com`，它将直接代理到 `https://example.com`。

### 3️⃣ 远程 JSON 配置（可选）
如果你想动态更新代理规则，可以在 `CONFIG_URL` 变量中填入一个 JSON 配置文件的地址。配置格式如下：

```javascript
const CONFIG_URL = "https://your-config-server.com/routes.json";
```

示例 JSON 配置：

```json
{
  "/gh/": "cdn.jsdelivr.net",
  "/google/": "www.google.com"
}
```

如果 `CONFIG_URL` 为空，则默认使用本地的 `defaultRouteConfig` 配置。

## 🎯 使用方法

1. **路径代理**：  
   - 访问 `https://your-worker.com/gh/jquery.js`  
   - 代理到 `https://cdn.jsdelivr.net/jquery.js`

2. **URL 代理**：  
   - 访问 `https://your-worker.com/https://example.com`  
   - 代理到 `https://example.com`

## 🛠️ 技术细节
- **强制桌面版 User-Agent**，避免 Cloudflare 误判为手机版
- **支持 `Access-Control-Allow-Origin: *`**，允许跨域请求
- **自动删除 `Referer` 和 `Origin` 头**，避免防盗链

## 📜 许可证
本项目采用 MIT 许可证，你可以自由修改和使用。

---

💡 **如果你有任何问题或改进建议，欢迎提交 Issue！** 🚀

