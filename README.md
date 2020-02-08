# mainetcn
Maimai DX 国服成绩查询 API。

## 使用方法
在你的 Node.js 项目中安装 `mainetcn` 包，并获取国服 maimaiNET 的访问 token 后，就可以在本项目中调取你的国服 Maimai DX 成绩数据和游戏历史数据。

以下是简单的例子。

```js
const mainetcn = require('mainetcn')

async function profile() {
  try {
    return (await mainetcn.gamedata({ ult: 'abc...', userId: '123...' }))
  } catch (e) { console.log(e) /* 不推荐在生产环境使用这种错误捕捉逻辑。 */ }
}

console.log(profile())
```

## 访问 Token？什么鬼？
由于国服 maimaiNET 统一使用微信登录，且华立及 SEGA 没有提供关联手机号或邮箱的选项、微信没有开放开发者调试工具的使用，因此若需要使用该框架访问 maimaiNET，需要使用 MitM（中间人）工具，获取利用 HTTPS 与华立服务器传输的、存放于浏览器 Cookie 中的 token。

完成 MitM 抓包需要特定的抓包软件。iOS 及 macOS 可以使用 [Surge](https://blog.wttft.com/201809101/)、Android 用户可以使用 [HttpCanary](https://play.google.com/store/apps/details?id=com.guoshi.httpcanary&hl=zh)。

具体方法是：

- 使用对应抓包/网络记录工具，安装 MitM 证书。（请确保你信任这个抓包软件。）然后打开抓包。
- 打开微信，打开「舞萌 DX」公众号，点击底部「我的记录」菜单。等待网页成功加载完毕后，
- 在抓取到的网络包记录中，找到发往 `https://maimai.wahlap.com/maimai-mobile/home/` 的 GET 请求通讯包。
- 在这个包中找到响应头，头内 `Set-Cookie` 参数中有对应的 token。

例如，你有可能会获取到这样的响应头：

```
HTTP/1.1 200 OK
Server: nginx
Date: Sat, 08 Feb 2020 09:27:19 GMT
Content-Type: text/html; charset=UTF-8
Transfer-Encoding: chunked
Connection: keep-alive
Set-Cookie: _t=<ULT>; expires=Tue, 05-Feb-2030 09:27:19 GMT; Max-Age=315360000; path=/
Set-Cookie: userId=<USERID>; path=/; HttpOnly
Expires: -1
...
```

其中，你可以找到名为 `_t` 和 `userId` 的 cookies（`<ULT>` 和 `<USERID>`），这就是本包需要的 token。在调用方法的时候，第一个参数永远是一个对象，对象中需要包含这两者才能正常访问 maimaiNET 数据（详见前述实例，`_t` 更名为 `ult`）。

另外，每次访问后，maimaiNET 会刷新这个 token。mainetcn 可以帮你刷新 token，但你需要自行完成新 token 的记录工作。在返回的数据中会有两个对象，一个是 `result`，即函数返回的结果本体，另一个是 `token`，即刷新后的 token。下一次只需要用刷新后的 token 即可完成请求。

提醒一下，若你在其他地方（包括但不限于微信公众号「舞萌 DX」内）访问过玩家数据，你需要手动刷新一次 token，即使用前述的 MitM 抓包方式进行刷新。

## 具体 API 列表

- `mainetcn.gamedata(token)`：获取玩家资料。
- `mainetcn.recent(token)`：获取最近游玩的 50 次谱面记录列表。
- `mainetcn.trackdetail(token, trackid)`：获取单次谱面详情。`trackid` 参数可以在 `mainetcn.recent(token)` 中的 `res.result[i].id`中获取。

## License & Disclaimer
MIT

本代码与华立、SEGA 等公司无任何关系，注册商标所有权归相关品牌所有。请勿使用本代码用于网络攻击或其他滥用行为。