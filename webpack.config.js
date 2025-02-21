const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',  // Changed to development for better debugging
  entry: {
    popup: './popup.js',
    background: './background.js',
    content: './content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: "88"
                }
              }]
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "popup.html", to: "popup.html" },
        { from: "icons", to: "icons" },
        { from: ".env", to: ".env" },
        { from: "styles.css", to: "styles.css", noErrorOnMissing: true }
      ],
    }),
  ],
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000
  },
  resolve: {
    extensions: ['.js'],
    fallback: {}
  },
  optimization: {
    minimize: false
  },
  devtool: 'source-map'  // Added for better debugging
};
