# TbSign➡️ Frontend

---

[TbSign➡️](https://github.com/BANKA2017/tbsign_go) 的前端部分，已支援大部分接口

## ⚠ 警告

- 开发者不提供任何公开的实例
- 不接受任何路线图以外的 PR，路线图内的 PR 不一定会接受
- 初期产品可能会有奇奇怪怪的 BUG，理应不影响使用，但有影响的请通过 issue 回报
- 使用非官方产品导致帐号封禁是很正常的，如果不能接受风险，请一开始就不要使用 （这里指的不是 TbSign➡️ 帐号）

## 部署

开箱即用，`npx nuxt generate` 后静态部署 `dist` 目录内的产物即可

### 后端

#### 通用前端

- 这里所有的 `http` 都可以根据实际情况换成 `https`；使用默认端口(如 `80`, `443`) 时 `:port` 可省略，下同
- 官方 demo 允许通过 `http` 访问，便于连接位于内网这些不便签发证书的环境，网页右下角会实时显示 API 的情况，点击 `http/https` 会返回完整的 `API` 端点信息
  - 请注意：`http` 环境并不安全，demo 网站和 `API` 返回都可能会被中间人监听或篡改，除非您很清楚自己在干什么，否则请使用 `https` 的网站和 `API`

首次访问时会跳转到 `/add_base_path` 添加首个 API basePath：

> 后端部署完成后即可知道 `http://ip:port`，如果绑定了自己的域名那就是 `http://domain:port`

添加完成后即可前往登录，也可以直接组装链接 `http://frontend:port/?endpoint=http://backend:port` 直接通过链接导入，注意最后面不需要斜杠

#### 专有前端

编辑环境变量 `NUXT_BASE_PATH`，填入后端地址，即可成为专有前端

#### 嵌入式前端

请参考 [BANKA2017/tbsign_go#嵌入式前端](https://github.com/BANKA2017/tbsign_go?tab=readme-ov-file#%E5%B5%8C%E5%85%A5%E5%BC%8F%E5%89%8D%E7%AB%AF)

## 限制

部分功能需要后端支持才会启用

- 注册页 `/signup` 需要站点开启注册才会在侧边栏显示，站点开启邀请码注册时才会有邀请码输入框
- 找回密码 `/reset_password` 要求后端能够通过电子邮件的设置检测，但页面开启不等于重置邮件可以正常发出或者能被收到
- 各个插件的设置页 (以 `/plugin_` 开头的页面) 需要站点开放了对应插件才会启用
- 由于几乎没有做任何防呆保护，所以刻意隐藏了一些危险的 API，比如删除账号或者导出帐号信息等
- 后端会刻意在数据发出前删除掉所有的 `BDUSS` 和 `Stoken` 信息，前端的所有页面都不需要用到这些信息
- 被封禁的帐号暂时无法查看或导出账号数据

## 插件

[BANKA2017/tbsign_go#插件开发](https://github.com/BANKA2017/tbsign_go?tab=readme-ov-file#%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91)

## TODO

可能会做，也可能永远是 TODO

- [x] 能用
- [ ] 完善权限控制，完善界面，统一风格，避免堆砌大块元素
- [ ] 完整的后端 API 支持
- [ ] 避免 AnyScript，完善类型
- [ ] 校验后端状态才允许调用，在明显位置展示后端地址，后端必须设置系统地址 (`system_url`) 才能使用面板
- [ ] 双 Token (RefreshToken, AccessToken)
- [ ] 工具箱，端点都准备好了，就差前端没写
- [x] 亮色模式非常亮……
