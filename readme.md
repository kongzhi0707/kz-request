### node 测试接口工具

使用 node 命令行工具编写一个 get/post 请求的接口工具，可以快速的测试我们的接口是否可行。我这边暂时叫 kz-ajax 命令。

目录结构如下:

```
|--- src
| |--- index.js
|--- cache.json
|--- package.json
|--- readme.md
```

src/cache.json 是缓存我们的接口的。默认情况下是一个空对象 {}，当我们缓存了接口的时候。会变成如下 key - value 对象。如下所示:

```
{
  "GET-https://api.github.com/users/k": {
    "method": "GET",
    "header": "application/json",
    "url": "https://api.github.com/users/kongzhi0707/repos",
    "token": "",
    "params": "",
    "response": "json",
    "cache": true
  },
  // ..... 更多键值对象数据
}
```

src/package.json 配置项如下：

```
{
  "name": "kz-ajax",
  "version": "1.0.0",
  "description": "node测试接口工具",
  "main": "index.js",
  "bin": {
    "kz-ajax": "./src/index.js"
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "npm",
    "cnpm",
    "yarn"
  ],
  "author": "kongzhi",
  "license": "ISC",
  "dependencies": {
    "chalk": "^4.0.0",
    "commander": "^11.1.0",
    "inquirer": "^8.0.0",
    "node-fetch": "^2.0.0"
  }
}
```

我们在命令行执行 kz-ajax 的时候，如下：

<img src="https://raw.githubusercontent.com/kongzhi0707/kz-ajax/master/images/1.png" /> <br />

可以看到有 get/post 两个命令行。

当我们执行命令 kz-ajax 的时候，会一步步询问：

<img src="https://raw.githubusercontent.com/kongzhi0707/kz-ajax/master/images/2.png" /> <br />

```
1）选择请求的方式是 GET/POST/PUT/DELETE，默认为 GET。
2）选择的请求头 application/x-www-form-urlencoded，application/json，multipart/form-data，text/plain，默认为：application/json。
3）输入请求的路径url。
4）输入token，如果有的话，没有直接回车键。
5）输入的参数，如果没有参数，直接按回车键。
6）选择返回的格式，默认为 json，可选值有：json/text/blob/buffer.
7) 是否缓存 Y 缓存 N 取消 缓存起来可以下次直接使用
```

最后我们就会返回接口请求的结果(https://api.github.com/users/kongzhi0707/repos)，如下所示:

<img src="https://raw.githubusercontent.com/kongzhi0707/kz-ajax/master/images/3.png" /> <br />

然后在我们的 src/cache.json 会缓存请求的数据。如下：

```
{
  "GET-https://api.github.com/users/k": {
    "method": "GET",
    "header": "application/json",
    "url": "https://api.github.com/users/kongzhi0707/repos",
    "token": "",
    "params": "",
    "response": "json",
    "cache": true
  },
  // ..... 更多键值对象数据
}
```

当我们继续执行命令 kz-ajax 的时候，会直接询问是否从缓存里面读取数据。然后我们选择一个请求 url 的 key 后，就会直接请求数据。如下所示：

<img src="https://raw.githubusercontent.com/kongzhi0707/kz-ajax/master/images/4.png" /> <br />

#### kz-ajax get 命令

当然我们也可以直接调用 kz-ajax get 命令，直接请求接口，如下所示：

<img src="https://raw.githubusercontent.com/kongzhi0707/kz-ajax/master/images/5.png" /> <br />

就会返回数据。

#### kz-ajax post 命令

我们也可以直接调用 kz-ajax post 命令，请求 post 接口，如下所示：

<img src="https://raw.githubusercontent.com/kongzhi0707/kz-ajax/master/images/6.png" /> <br />

先输入 url，然后参数，最后直接返回数据。上面的请求失败是因为 我那个接口是 get 请求的接口，但是我用 post 请求它就会异常。

最后就是 src/index.js 的所有代码如下：

```
#!/usr/bin/env node

const { program } = require('commander');
const http = require('node-fetch')
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs= require('fs')
const path = require('path');

const cacheJson = require('../cache.json');
const PKG = require('../package.json');

program.version(PKG.version).description('查看版本号');

program.description('请求API').action(async () => {

  const keys = Object.keys(cacheJson);
  if (keys.length > 0) {
    // 确认框
    const { isCache } = await inquirer.prompt([
      {
        type: "confirm",
        name: "isCache",
        message: "是否从缓存中读取"
      }
    ]);
    if (isCache) {
      const res = await inquirer.prompt([
        {
          type: "list",
          name: "cache",
          choices: keys,
          message: "请选择缓存的请求"
        }
      ]);
      const value = cacheJson[res.cache];
      sendHttp(value);
    } else {
      const result = await inquirer.prompt([
        {
          type: "list",
          name: "method",
          choices: ['GET', 'POST', 'PUT', 'DELETE'],
          default: "GET"
        },
        {
          type: "list",
          name: "header",
          message: "请选择请求头",
          choices: [
            "application/x-www-form-urlencoded",
            "application/json",
            "multipart/form-data",
            "text/plain"
          ],
          default: "application/json"
        },
        {
          type: "input",
          name: "url",
          message: "请求资源url",
          default: "http:// | https://"
        },
        {
          type: "input",
          default: "",
          message: "请输入token(GET请忽略)",
          name: "token"
        },
        {
          type: "input",
          name: "params",
          message: "请输入参数",
          default: ""
        },
        {
          type: "list",
          name: "response",
          message: "请选择返回格式(默认json)",
          choices: ['json', 'text', 'blob', 'buffer'],
          default: 'json'
        },
        {
          type: "confirm",
          message: "是否缓存",
          name: "cache"
        }
      ])
      sendHttp(result);
    }
  } else {
    // 如果没有缓存
    const result = await inquirer.prompt([
      {
        type: "list",
        name: "method",
        choices: ['GET', 'POST', 'PUT', 'DELETE'],
        default: "GET"
      },
      {
        type: "list",
        name: "header",
        message: "请选择请求头",
        choices: [
          "application/x-www-form-urlencoded",
          "application/json",
          "multipart/form-data",
          "text/plain"
        ],
        default: "application/json"
      },
      {
        type: "input",
        name: "url",
        message: "请求资源url",
        default: "http:// | https://"
      },
      {
        type: "input",
        default: "",
        message: "请输入token(GET请忽略)",
        name: "token"
      },
      {
        type: "input",
        name: "params",
        message: "请输入参数",
        default: ""
      },
      {
        type: "list",
        name: "response",
        message: "请选择返回格式(默认json)",
        choices: ['json', 'text', 'blob', 'buffer'],
        default: 'json'
      },
      {
        type: "confirm",
        message: "是否缓存",
        name: "cache"
      }
    ])
    sendHttp(result);
  }
});

// 读写json文件添加缓存
const cache = (params) =>  {
  cacheJson[params.method + '-' + params.url.substring(0, 30)] = params;
  fs.writeFileSync(path.join(__dirname, '../cache.json'), JSON.stringify(cacheJson, null, 4))
}

const sendHttp = async (result) => {
  try {
    const response = await http(result.url, {
      method: result.method,
      body: result.params || undefined,
      headers: {
        'Content-Type': result.header,
        Authorization: result.token ?? ""
      }
    });
    console.log('---response---', response);
    console.log('---result---', result);
    const val = await response[result.response]();
    if (result.cache) {
      cache(result);
    }
    console.log(chalk.green('success'));
    console.log(val);
  } catch (e) {
    console.log(chalk.red('error'));
    console.log(e);
  }
}

// get 命令
program.command('get').description('发起get请求').action(async () => {
  const { url } = await inquirer.prompt([
    {
      type: "input",
      name: "url",
      message: '请输入get请求url',
      validate(v) {
        if (!v) {
          return 'url不能为空'
        }
        return true;
      }
    }
  ])
  try {
    const response = await http(url).then(res => res.json());
    console.log(chalk.green('success'));
    console.log(response);
  } catch (e) {
    console.log(chalk.red('error'));
    console.log(e);
  }
});

// post 命令
program.command('post').description('发起post请求').action(async () => {
  const { url, params } = await inquirer.prompt([
    {
      type: "input",
      name: "url",
      message: "请输入post请求url",
      validate(v) {
        if (!v) {
          return 'url不能为空';
        }
        return true;
      }
    },
    {
      type: "input",
      name: "params",
      message: "请输入参数(没有请忽略)",
      default: ""
    }
  ])
  try {
    const response = await http(url, {
      method: "post",
      body: JSON.stringify(params) || undefined,
      headers: {
        "Content-Type": "application/json"
      }
    }).then(res => res.json());
    console.log(chalk.green('success'));
    console.log(response);
  } catch (e) {
    console.log(chalk.red('error'));
    console.log(e);
  }
})

program.parse(process.argv);
```
