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