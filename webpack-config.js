'use strict';

var webpack = require('webpack');

var isDevelopment = process.env.NODE_ENV !== 'production';
var isProduction = !isDevelopment;

console.log('* Starting Webpack');
console.log('* isDevelopment = ' + isDevelopment);

/* Plugins */
var plugins = [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        new webpack.DefinePlugin({
            NODE_ENV: process.env.NODE_ENV === "production" ? "production" : "development"
        })
    ].concat(isDevelopment ? [] :
    [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({minimize: true}),
        new webpack.optimize.AggressiveMergingPlugin()
    ]);

/* ------- */
module.exports = {
    entry: {
        'crosser-with-rsvp' : './lib/crosser-with-rsvp',
        'crosser' : './lib/crosser'
    },
    output: {
        filename: './[name].' + (isProduction ? 'min.' : '') + 'js'
    },
    eslint: {
        configFile: './.eslintrc'
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'eslint-loader'
            }
        ],
        loaders: [
            //{test: /\.css$/, loader: "style!css"},
            //{test: /\.(png|jpg|jpeg|gif|svg)$/, loader: 'url-loader?limit=10000'},
            //{test: /\.scss$/, loader: "style!css!sass"},
            {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
        ]
    },

    plugins: plugins,
    cache: isDevelopment,
    debug: isDevelopment,
    devtool: isDevelopment ? 'source-map' : false
};
