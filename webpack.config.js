const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');

const extractLESS = new ExtractTextPlugin('cmpui.css');

// * * * * * Common Config * * * * * //

const commonConfig = assetPath => {
    return {
        entry: {
            cmpui: './src/cmpui/cmpui.js'
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.less$/i,
                    use: extractLESS.extract([ 'css-loader', 'less-loader' ])
                },
                {
                    test: /\.svg/,
                    use: {
                        loader: 'svg-url-loader',
                        options: {}
                    }
                },
                {
                    test: /vendor\/.+\.(jsx|js)$/,
                    loader: 'imports?jQuery=jquery,$=jquery,this=>window'
                }
            ]
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'build'),
            publicPath: assetPath.baseDir
        },
        plugins: [
            new HtmlWebpackPlugin({
                inject: false,
                template: './src/cmpui/cmpui.html',
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
                {from: 'src/cmpui/images/*', to: 'images', flatten: true}
            ]),
            new webpack.DefinePlugin({
                'process.env.ASSET_PATH': JSON.stringify(assetPath)
            }),
            extractLESS
        ],
        node: {
            fs: 'empty'
        },
        resolve: {
            alias: {
                'handlebars' : 'handlebars/dist/handlebars.js'
            }
        }
    };
};

// * * * * * Production Config * * * * * //

const productionConfig = {
    plugins: [new CleanWebpackPlugin(['build']), new UglifyJSPlugin()]
};

// * * * * * Development Config * * * * * //

const developmentConfig = {
    devServer: {
        contentBase: './build',
        hot: true,
        port: 9000
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), new webpack.NamedModulesPlugin()]
};

// * * * * * Environment Config * * * * * //

const ASSET_PATHS = {
    dev: {},
    prod: {}
};

module.exports = env => {
    if (env === 'prod') {
        return merge(commonConfig(ASSET_PATHS.prod), productionConfig);
    }
    return merge(commonConfig(ASSET_PATHS.dev), developmentConfig);
};
