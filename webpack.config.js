const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        chat: './chat.js',
        background: './background.js',
        content: './content-script.js',
        tests: './test_script.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json" },
                { from: "chat.html" },
                { from: "styles", to: "styles" },
                { from: "icons", to: "icons" }
            ]
        })
    ]
};