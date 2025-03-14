const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/ui/popup.js',
    background: './src/background/background.js',
    content: './src/content/content.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
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
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: './src/ui/popup.html', to: '.' },
        { from: './src/ui/styles.css', to: '.' },
        { from: 'icons', to: 'icons' }
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  }
};
