const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const extractLESS = new ExtractTextPlugin('cmpui.css');

const commonConfig = {
    entry: {
        cmpui: './src/cmpui.js'
    },
    module: {
        rules: [{
            test: /\.less$/i,
            use: extractLESS.extract(['css-loader', 'less-loader'])
        }, {
            test: /\.svg/,
            use: {
                loader: 'svg-url-loader',
                options: {}
            }
        }, {
            test: /vendor\/.+\.(jsx|js)$/,
            loader: 'imports?jQuery=jquery,$=jquery,this=>window'
        }]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build')
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: false,
            template: './src/cmpui.html',
            chunks: ['cmpui'],
            filename: './cmpui.html',
            minify: {
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true
            }
        }),
        new CopyWebpackPlugin([
            {from: 'src/images/*', to: 'images', flatten: true}
        ]),
        extractLESS
    ],
    node: {
        fs: 'empty'
    },
    resolve: {
        alias: {
            'handlebars': 'handlebars/dist/handlebars.js'
        }
    }
};

const productionConfig = {
    plugins: [new CleanWebpackPlugin(['build']), new UglifyJSPlugin()]
};

const developmentConfig = {
    devServer: {
        contentBase: './build',
        hot: true,
        port: 9000
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), new webpack.NamedModulesPlugin()]
};

module.exports = function (env) {
    return merge(commonConfig, (env === 'prod') ? productionConfig : developmentConfig);
};
