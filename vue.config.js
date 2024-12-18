const { defineConfig } = require("@vue/cli-service");
const fs = require("fs");
const path = require("path");
const homedir = require("os").homedir();

module.exports = defineConfig({
    transpileDependencies: true,
    // 配置相对路径
    publicPath: '/office.zotero/dist',
    devServer: {
        port: 8081,
        server: {
            type: "https",
            options: {
                // key: fs.readFileSync(path.resolve(`${homedir}/certs/private.key`)),
                // cert: fs.readFileSync(path.resolve(`${homedir}/certs/private.crt`)),
                cert: fs.readFileSync(path.join(__dirname, "src/ssl/cert.crt")),
                key: fs.readFileSync(path.join(__dirname, "src/ssl/cert.key")),
            },
        },
    },
    // 配置index的文件名称
    pages: {
        index: {
            filename: "taskpane.html",
            title: "Office Zotero",
            entry: "src/main.js",
        },
    },
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.(csl|xml)$/, // 匹配 .txt 文件
                    use: "raw-loader", // 使用 raw-loader 处理
                },
            ],
        },
    },
});
